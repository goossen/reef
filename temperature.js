var fs = require('fs'),
    path = require('path'),
    sensor = require('ds18b20');

var currentState = [];

//keep the state of the buttons.json file in memory
var sensorsJSON;

fs.watchFile(path.join(__dirname, 'public/json/sensors.json'), function (curr, prev) {
   console.log('sensors.json updated');
   _readJSON();
});

function _readJSON() {
   _loadFile(path.join(__dirname, 'public/json/sensors.json'), function(response) {
      this.sensorsJSON = JSON.parse(response);
   });
}

function _loadFile(file, callback) {
   fs.readFile(file, 'utf8', function (err, data) {
      if (err) {
         console.log('Error: ' + err);
         return;
      }
      callback(data)
   });
}

function _getTemperatures() {
   sensor.sensors(function(err, ids) {
      if (err) {
         console.log('Can not get sensor IDs', err);
      } else {
         for (var id in ids) {
            _sense(ids[id]);
         }
      }
   });
}

function _sense(id) {
   sensor.temperature(id, function(err, result) {
      if (err) {
         console.log('Can not get temperature from sensor', err);
      } else {

         //get label for sensor from sensors.json file
         var label = id;
         var jsonSensors = this.sensorsJSON.sensors;
         jsonSensors.forEach(function (sensor) {
            if (sensor.id === id) {
               label = sensor.label;
            }
         });

         var tempF=result * 9 / 5 + 32;
         
         app.io.broadcast('temperature', {message: label + ':' +  Math.round(tempF * 10) / 10})
      }
   });
}

exports.startLogging = function() {
   _readJSON();
   setInterval(function() {
      _getTemperatures();
   }, 15000);
}

exports.getTemperatures = function() {
   _getTemperatures();
}


