
# install npm, git
apt-get install npm
apt-get install git

#install nvm, node
sudo mkdir /opt/node
wget http://nodejs.org/dist/v0.11.10/node-v0.11.10-linux-arm-pi.tar.gz
tar xvzf node-v0.11.10-linux-arm-pi.tar.gz
sudo cp -r node-v0.11.10-linux-arm-pi/* /opt/node
rm -rf node-v0.11.10-linux-arm-pi
rm -rf node-v0.11.10-linux-arm-pi.tar.gz

nano /etc/profile
# add these lines before export PATH
NODE_JS_HOME="/opt/node"
PATH="$PATH:$NODE_JS_HOME/bin"

logout



# install connect, forever
npm config set registry http://registry.npmjs.org/
npm install connect
sudo -i npm install forever -g

# set nodejs server to run as a service
forever start /home/pi/reef/server.js


