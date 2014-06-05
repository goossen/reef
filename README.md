#Reef

A Raspberry Pi based controller for marine aquariums.

## Basics
The RPi functions as a server, running node.js.  By connecting with a web browser, users can view the status of the aquarium pumps, filters, lights, heater and temperature.

### Power control
The RPi is connected to power relays using the GPIO pins.  Each relay in turn is connected to a power outlet used by the aquarium devices.  The lights can be individually scheduled to turn on/off on a daily schedule.  The pumps can be scheduled to power on and off at set intervals to imitate wave and tidal actions.  All devices may be individually controlled, such as during filter media or water changes.

The GPIO pins are controlled using the pi-gpio library.  The usage is based on an example of a web-controlled power strip: http://www.instructables.com/id/Web-Controlled-8-Channel-Powerstrip/?ALLSTEPS

### Temperature monitoring
Temperature sensors are connected to the RPi and monitor the current water temperature.  The temperature sensor can be used as a failsafe for the aquarium heater.  The temperature sensor(s) uses the ds18b20 library.  An example of its usage is give here: https://learn.adafruit.com/adafruits-raspberry-pi-lesson-11-ds18b20-temperature-sensing?view=all

![Insides](https://raw.github.com/goossen/reef/master/insides.jpg)

### User Interface
The user interface is html, css and straight javascript.  express.io is used to push updates from the server to connected clients.

![ScreenShot](https://raw.github.com/goossen/reef/master/screenshot1.png)

## Installation

### Clone the git repository
  * cd into the parent directory you want to install the project in
  * git clone the project into a child directory

All dependencies are copied as a part of the clone operation.

### Install node (Raspberry Pi flavor)
```Shell
sudo mkdir /opt/node
wget http://nodejs.org/dist/v0.11.10/node-v0.11.10-linux-arm-pi.tar.gz
tar xvzf node-v0.11.10-linux-arm-pi.tar.gz
sudo cp -r node-v0.11.10-linux-arm-pi/* /opt/node
rm -rf node-v0.11.10-linux-arm-pi
rm -rf node-v0.11.10-linux-arm-pi.tar.gz
```

### Add node to your path
```Shell
# add these lines  to /etc/profile before the export PATH statement
NODE_JS_HOME="/opt/node"
PATH="$PATH:$NODE_JS_HOME/bin"
```

### Setup gpio privileges
```Shell
git clone git://github.com/quick2wire/quick2wire-gpio-admin.git
cd quick2wire-gpio-admin
make
sudo make install
sudo adduser $USER gpio
```

### Set nodejs.sh startup behavior
```Shell
chmod 755 nodejs.sh
sudo cp nodejs.sh /etc/init.d
sudo update-rc.d nodejs.sh defaults
```




