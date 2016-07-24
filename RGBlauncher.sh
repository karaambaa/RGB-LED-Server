#!/bin/sh
# launcher.sh
# navigate to home directory, then to this directory, then execute python script, then back home

cd /
cd bin
sudo killall pigpiod
sudo pigpiod
sudo python /bin/lightberry/server.py >/tmp/RGBserver.log 2>&1 &
cd /
