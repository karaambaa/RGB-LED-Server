#!/bin/bash

if (whiptail --title "Setup Lightberry" --yesno "You are about to configure your \
Raspberry Pi as a RGB-Led server running PIGPIO. Are you sure you want to \
continue?" 8 78) then
 whiptail --title "Setup Lightberry" --infobox "Lightberry will be installed and \
 configured." 8 78
else
 whiptail --title "Setup Lightberry" --msgbox "Cancelled" 8 78
 exit
fi

# Update packages and install openvpn
echo "Updating, Upgrading, and Installing..."
BASEDIR=$(dirname "$0")
apt-get update
apt-get -y upgrade
apt-get -y install pip
apt-get install apache2 -y
sudo apt-get install python-pip python2.7-dev portaudio19-dev python-scipy -y
sudo pip install pyaudio
cd /
pip install sockjs-tornado 
pip install -r requirements.txt  # From the console source root 
cd ~
rm pigpio.zip
sudo rm -rf PIGPIO
wget abyz.co.uk/rpi/pigpio/pigpio.zip
unzip pigpio.zip
cd PIGPIO
make -j4
sudo make install
cd BASEDIR

echo "setting up Website"
sudo rm -rf var/www/html/*
sudo cp -r html/* var/www/html/

echo "setting up Pythonscripts"
sudo mkdir /bin/lightberry
sudo cp server.py /bin/lightberry/
sudo cp RGBlauncher.sh /bin/lightberry

crons=$(sudo crontab -l)
coman="@reboot sh /bin/RGBlauncher.sh"

if echo "$crons" | grep -q "$coman"; then
    echo "Autostart allready enabled"
else
    ( sudo crontab -l ; echo "@reboot sh /bin/lightberryRGBlauncher.sh" ) | crontab -
fi
