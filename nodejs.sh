#!/bin/bash

NODE=/opt/node/bin/node
SERVER_JS_FILE=/home/pi/github.com/goossen/reef/server.js
USER=pi
OUT=/home/pi/github.com/goossen/reef/nodejs.log

cd /home/pi/github.com/goossen/reef

case "$1" in

start)
        echo "starting node: $NODE $SERVER_JS_FILE"
        sudo -u $USER $NODE $SERVER_JS_FILE > $OUT 2>$OUT &
        ;;

stop)
        killall $NODE
        ;;

*)
        echo "usage: $0 (start|stop)"
esac

exit 0



