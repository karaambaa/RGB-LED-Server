#!/usr/bin/env python
# import all needed libraries

import sys
import time
import sockjs.tornado
from tornado import web, ioloop
from sockjs.tornado import SockJSRouter, SockJSConnection
import pigpio
import subprocess
import os
import signal
from thread import start_new_thread
import random
import colorsys
import pyaudio
from scipy.signal import butter, lfilter, freqz
import numpy as np

# Initial setup of GPIO pins
pi = pigpio.pi()

############################### setting basic options  ###############################
bright    = 255

# The Pins. Use Broadcom numbers.
RED_PIN   = 17
GREEN_PIN = 22
BLUE_PIN  = 24

# listening port
port      = 1713

# Global variables for Music
CHUNK     = 512 # How many bytes of audio to read at a time
global HUE
HUE = 0

############################### setting effect options  ##############################
mode = "nothing"


############################### basic functions  ###############################
class LedController:
    def hex_to_rgb(self, hex):
        hex = hex.lstrip('#')
        lv = len(hex)
        rgb = tuple(int(hex[i:i + lv // 3], 16) for i in range(0, lv, lv // 3))
        return rgb

    def rgb_to_hex(self, rgb):
        hex = "#"
        for i in range(3):
            hex + hex(rgb[i]).split('x')[1]
        return hex

    def hsl_to_rgb(self, hsl):
        colour_tuple = tuple(i * 255 for i in colorsys.hls_to_rgb(hsl[0], hsl[2], hsl[1]))
        return colour_tuple
    
    def checkRGB(self, color):
        if (color < 0):
            color = 0
        if (color > 255):
            color = 255
        return color

    def scale(self, brightness):
        realBrightness = int(int(brightness) * (float(bright) / 255.0))
        # Ensure we are giving correct values
        if realBrightness < 0:
            realBrightness = 0.0
        elif realBrightness > 100:
            realBrightness = 100.0
        return realBrightness
    
    def setLights(self, pin, brightness):
        realBrightness = self.scale(brightness)
        pi.set_PWM_dutycycle(pin, realBrightness)

    def setRGB(self, r, g, b):
        r = self.checkRGB(r)
        g = self.checkRGB(g)
        b = self.checkRGB(b)
        self.setLights(RED_PIN, r)
        self.setLights(GREEN_PIN, g)
        self.setLights(BLUE_PIN,b)
        print "changing color to rgb(" + str(r) + "," + str(g) + "," + str(b) + ")"
        #BrokerConnection.color_broadcaster(r,g,b)

    def noWhite(self, r, g, b):
        r /= 255.0
        g /= 255.0
        b /= 255.0
        HSL = colorsys.rgb_to_hls(r, g, b)
        h = HSL[0]
        l = HSL[1]
        s = HSL[2]
        if (l > 0.8):
            l *= 0.8 # scale down lightness when higher than 80%
        if (s < 0.4):
            s = (s * 0.6) + 0.4 # scale saturation up when lower than 40%
        return tuple(i * 255 for i in colorsys.hls_to_rgb(h, l, s))


############################### Rainbow functions  ###############################
class Rainbow:
    
    def updateColor(self, color, step):
            color += step
            if color > 255:
                color = 255
            if color < 0:
                color = 0
            return color

    def fader(self, r, g, b):
        lc = LedController()
        if not ((r == 255 or r == 0) and (b == 255 or b == 0) and (g == 255 or g == 0) and (r == 255 and g == 255 and b == 255) and (r == 0 and g == 0 and b == 0)):
            while r < 255:
                r = self.updateColor(r, STEPS)
                lc.setRGB(r, g, b)
            while b > 0:
                b = self.updateColor(b, -STEPS)
                lc.setRGB(r, g, b)
        while (mode == "Rainbow"):
            if r == 255 and b == 0 and g < 255:
                g = self.updateColor(g, STEPS)
                lc.setRGB(r, g, b)

            elif g == 255 and b == 0 and r > 0:
                r = self.updateColor(r, -STEPS)
                lc.setRGB(r, g, b)

            elif r == 0 and g == 255 and b < 255:
                b = self.updateColor(b, STEPS)
                lc.setRGB(r, g, b)

            elif r == 0 and b == 255 and g > 0:
                g = self.updateColor(g, -STEPS)
                lc.setRGB(r, g, b)

            elif g == 0 and b == 255 and r < 255:
                r = self.updateColor(r, STEPS)
                lc.setRGB(r, g, b)

            elif r == 255 and g == 0 and b > 0:
                b = self.updateColor(b, -STEPS)
                lc.setRGB(r, g, b)

############################### Music functions  ###############################

class FreqAnalyser:
    # Filtering based on
    # http://wiki.scipy.org/Cookbook/ButterworthBandpass
    
    def __init__(self, channels, sample_rate, leds=None):
        self.leds = leds # Not needed if just plotting
        self.channels = channels
        self.sample_rate = sample_rate
        self.nyquist = float(sample_rate) / 2

        # Filter order - higher the order the sharper
        # the curve
        order = 3

        # Cut off frequencies:
        # Low pass filter
        cutoff = 200 / self.nyquist
        # Numerator (b) and denominator (a)
        # polynomials of the filter. 
        b, a = butter(order, cutoff, btype='lowpass')
        self.low_b = b
        self.low_a = a

        # High pass filter
        cutoff = 4000 / self.nyquist
        b, a = butter(order, cutoff, btype='highpass')
        self.high_b = b
        self.high_a = a
        
        # Keep track of max brightness for each
        # colour
        self.max = [0.0, 0.0, 0.0]
        # Make different frequencies fall faster
        # bass needs to be punchy.
        self.fall = [15.0, 2.5, 5.0]
    
    def filter(self, data):
        # Apply low filter
        self.low_data = lfilter(self.low_b,
                                self.low_a,
                                data)

        # Apply high filter
        self.high_data = lfilter(self.high_b,
                                 self.high_a,
                                 data)
 
        # Get mid data by doing signal - (low + high)
        self.mid_data = np.subtract(data,
                        np.add(self.low_data,
                               self.high_data))

    @staticmethod
    def rms(data):
        # Return root mean square of data set
        # (i.e. average amplitude)
        return np.sqrt(np.mean(np.square(data)))

    def change_leds(self):
        lc = LedController()
        
        # Get average amplitude
        l = []
        l.append(self.rms(self.low_data))
        l.append(self.rms(self.mid_data))
        l.append(self.rms(self.high_data))
        
                             
        if mode == "Music":
            swift = (sum(l) * random.uniform(0, 7))
            if swift < 0.5:
                swift = 0.5

            if (MusicColor == "Auto"):
                global HUE
                HUE += swift
            else:
                rgb = lc.hex_to_rgb(MusicColor)
                rgb = [float(rgb[i]) / 255.0 for i in range(3)]
                global HUE
                HUE = colorsys.rgb_to_hls(rgb[0], rgb[1], rgb[2])[0] * 360
            light = 0.01 + l[0]
            if HUE > 360:
                HUE = 0 + (HUE - 360)
            if light > 0.6:
                light = 0.6

            RGB = lc.hsl_to_rgb([HUE / 360, light, 1])
                             
        elif mode == "Music1":
            equalizer = MusicColor.split('#')

            for i in range(3):
                # Do any number fudging to make it look better
                # here - probably want to avoid high values of
                # all because it will be white 
                # (Emphasise/Reduce bass, mids, treble)
                l[i] *= equalizer[i]
                l[i] = (l[i] * 256) - 1

                # Use new val if > previous max
                if l[i] > self.max[i]:
                    self.max[i] = l[i]
                else:
                    # Otherwise, decrement max and use that
                    # Gives colour falling effect
                    self.max[i] -= self.fall[i]
                    if self.max[i] < 0:
                        self.max[i] = 0
                l[i] = self.max[i]
            RGB = l
                             
        lc.setRGB(RGB[0], RGB[1], RGB[2])

class AudioController:
    def __init__(self, leds):
        self.line_in = True

        self.leds = leds
        self.p = pyaudio.PyAudio()
    
    def more(self):
        try:
            # Return line in data
            return self.stream.read(CHUNK)
        except:
            print "line-in error"
            return 'ab'

    def analyse(self, data):
        # Convert to numpy array and filter
        data = np.fromstring(data, dtype=np.int16)

        # Convert int16 to float for dsp
        data = np.float32(data/32768.0)

        # Send to filter
        self.analyser.filter(data)

        self.analyser.change_leds()

    def record_setup(self):
        self.channels = 1
        self.sample_rate = 44100
        self.stream = self.p.open(format = pyaudio.paInt16,
                                  channels = self.channels,
                                  rate = self.sample_rate,
                                  input=True,
                                  frames_per_buffer=CHUNK)

    def loop(self):
        # Main processing loop
        # Do appropriate setup
        self.record_setup()
        
        self.analyser = FreqAnalyser(self.channels,
                                     self.sample_rate,
                                     self.leds)
        
        # Read the first block of audio data 
        data = self.more()

        # While there is still audio left
        while (mode == "Music") or (mode == "Music1"):
            try:
                # Analyse data and change LEDs
                self.analyse(data)

                # Get more audio data
                data = self.more()
            except KeyboardInterrupt:
                break

        # Tidy up
        self.stream.close()
        self.p.terminate()

    
############################### other Effects functions  ###############################

class Effects:
    def Flasher(self):
        while (mode == "Flash"):
            random = self.Random_color()
            RGB = LedController().noWhite(random[0],random[1],random[2])
            r = RGB[0]
            g = RGB[1]
            b = RGB[2]
            LedController().setRGB(r, g, b)
            time.sleep(tempo)

    def Strober(self):
        while (mode == "Strobe"):
            if tempo < 0:
                random = self.Random_color()
                LedController().setRGB(random[0],random[1],random[2])
                self.wait_s(tempo)
                LedController().setRGB(0, 0, 0)
                self.wait_s(tempo)
            else:
                LedController().setRGB(255, 255, 255)
                self.wait_s(tempo)
                LedController().setRGB(0, 0, 0)
                self.wait_s(tempo)
            
    def Random_color(self):
        h = random.uniform(0, 100) / 100
        s = random.uniform(95, 100) / 100
        v = random.uniform(88, 100) / 100
        return tuple(i * 255 for i in colorsys.hsv_to_rgb(h, s, v))
    
    def wait_s(self,seconds):
        if seconds < 0:
            time.sleep((seconds) * (-1))
        elif seconds >= 0:
            time.sleep(seconds)

        
###################################### Socket ######################################
class BrokerConnection(sockjs.tornado.SockJSConnection):
    clients = set()
    lc = LedController()
    rb = Rainbow()
    ef = Effects()
    ac = AudioController(lc)
    
    def on_open(self, info):
        # When new client comes in, will add it to the clients list
        self.clients.add(self)

    def on_message(self, message):
        # For every incoming message, broadcast it to all clients
        #self.broadcast(self.clients, message)
	    # Set RGB color
        if not 'r' in locals(): 
            r = 0
        if not 'g' in locals(): 
            g = 0
        if not 'b' in locals(): 
            b = 0
        aRGB = self.message_analyser(message)
        if len(aRGB) == 3:
            r = float(aRGB[0])
            g = float(aRGB[1])
            b = float(aRGB[2])
            if not mode == "nothing":
                mode = "nothing"
                time.sleep(0.1)
            self.lc.setRGB(r,g,b)
                
        if len(aRGB) == 2:
            global mode
            if not mode == "nothing":
                threadRunning = True
            else:
                threadRunning = False
            old_mode = mode
            mode = aRGB[0]
            setting = aRGB[1]
            if (mode == 'Rainbow'):
                global STEPS
                STEPS = float(setting)
                print "starting " + mode + "-service with " + str(STEPS) + " steps"
                if not mode == old_mode:
                        start_new_thread(self.rb.fader, (r,g,b))
            elif (mode == 'Music' or mode == 'Music1'):
                global MusicColor
                if mode == 'Music1':
                    MusicColor = setting.split('#')
                else:
                    MusicColor = setting
                print "starting " + mode + "-service with "  + str(MusicColor) + " color settings"
                if not mode == old_mode:
                        start_new_thread(self.ac.loop, ())
            elif (mode == "Flash"):
                global tempo
                tempo = float(setting)
                print "starting " + mode + "-service with a tempo of "  + str(tempo)
                if not mode == old_mode:
                        start_new_thread(self.ef.Flasher, ())
            elif (mode == "Strobe"):
                global tempo
                tempo = float(setting)
                print "starting " + mode + "-service with a tempo of "  + str(tempo)
                if not mode == old_mode:
                        start_new_thread(self.ef.Strober, ())
                        
    def message_analyser(self,msg):
        RGBcolor = [0,0,0]
        if msg.startswith('#'):
            RGBcolor = lc.hex_to_rgb(msg)
        elif msg.startswith('rgb'):
            RGBcolor = msg[4:-1].split(',')
        elif msg.startswith('hsl'):
            RGBcolor = lc.hsl_to_rgb(msg[4:-1].split(','))
        elif msg.count(',') == 1:
            RGBcolor = msg.split(',')
        elif msg.count(',') == 2 and not any(c.isalpha() for c in msg):
            RGBcolor = msg.split(',')
        else:
            RGBcolor = [0,0,0]
            print "Unsupported color model"
        return RGBcolor

    def on_close(self):
        # If client disconnects, remove him from the clients list
        self.clients.remove(self)
        
    def color_broadcaster(self,r,g,b):
        rgb = "rgb(" + str(r) + ", " + str(g) + ", " + str(b) + ")"
        self.send_message(rgb)

if __name__ == '__main__':
    if len(sys.argv) > 1:
        options['immediate_flush'] = False

    # 1. Create SockJSRouter
    BrokerRouter = sockjs.tornado.SockJSRouter(BrokerConnection, '/rgb')

    # 2. Create Tornado web.Application
    app = web.Application(BrokerRouter.urls)

    # 3. Make application listen on port
    app.listen(port)

    # 4. Every 1 second dump current client count
#    ioloop.PeriodicCallback(BrokerConnection.dump_stats, 1000).start()

    # 5. Start IOLoop
    ioloop.IOLoop.instance().start()
