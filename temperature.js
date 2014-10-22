var fs = require('fs'),
    path = require('path'),
    sensor = require('ds18b20'),
    nodeschedule = require('node-schedule');

var emailer = require('./emailer.js');

// setup a recurring job to log temperatures every hour
var rule1 = new nodeschedule.RecurrenceRule();
rule1.minute = 0;

var j = nodeschedule.scheduleJob(rule1, function(){
    _logTempsToFile();
});

// setup a recurring job to send emails every day at 6PM
var rule2 = new nodeschedule.RecurrenceRule();
rule2.hour = 18;
rule2.minute=0;

var j = nodeschedule.scheduleJob(rule2, function(){
    _emailTemps();
});

var scheduler = require('./scheduler.js');

var currentState = [];
var dailyState = [];

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
         tempF = Math.round(tempF * 10) / 10;

         //controller fan & heater
         _controlTemp(label, tempF);

         //log temps to file
         _logTemp(label, tempF);
         
         app.io.broadcast('temperature', {message: label + ':' + tempF})
      }
   });
}

function _controlTemp(label, tempF) {
   if (label === 'tank') {
      if (tempF > 80.5) {
         console.log('Turning on fan');
         //_email("Turning on fan", "Turning on fan (" + tempF + "F) at " + new Date());
         scheduler.setPower('button3', 'on');
      } else if (tempF < 80.0) {
         console.log('Turning off fan');
         //_email("Turning off fan", "Turning off fan (" + tempF + "F) at " + new Date());
         scheduler.setPower('button3', 'off');
      }
   }   
   if (label === 'heater') {
      if (tempF > 81.0) {
         console.log('Turning off heater');
         scheduler.setPower('button8', 'off');
      } else if (tempF < 78.0) {
         console.log('Turning on heater');
         scheduler.setPower('button8', 'on');
      }
   }  
}


//keep track of the latest temp for each sensor
function _logTemp(label, tempF) {
   if (currentState === undefined || currentState.length === 0) {
      currentState[0] = {"id":label, "state":tempF};
   } else {
      var logged = false;
      for (var i = 0; i < currentState.length; i++) {
         if (currentState[i].id === label) {
             currentState[i] = {"id":label, "state":tempF};
             logged = true;
             break;
         }
      }
      if (!logged) {
         currentState[currentState.length] = {"id":label, "state":tempF};
      }
   }
}

// every hour, write the last temps to a file
function _logTempsToFile() {
//Date,Series1,Series2
//2009/07/12,100,200  # comments are OK on data lines
//2009/07/19,150,201

   var toSort = currentState;

   toSort.sort(function(a, b){
      if(a.id < b.id) return -1;
      if(a.id > b.id) return 1;
      return 0;
   })

   var csv = new Date().toLocaleString(); //7/29/2014 9:38:06 AM

   csv += ',';
   for (var i = 0; i < toSort.length; i++) {
      csv += toSort[i].state;
      if (i < toSort.length-1) {
         csv += ', ';
      }
   }

   console.log(csv);

   /*fs.appendFile('temps.csv', csv, function (err) {
      if (err) console.log('Error writing to temps.csv ' + err);
   });*/

   if (dailyState.length >= 24) {
      // remove the first item
      dailyState.splice(0, 1);
   }

   dailyState.push(csv);

}

// every day, email the temps
function _emailTemps() {
   var messageBody = 'Date, Room, Tank';
   messageBody += '<br>';
   var send = false;

   for (var i = 0; i < dailyState.length; i++) {

      //if the last csv entry is <81 and >77 skip email
      var n = dailyState[i].substring(dailyState[i].lastIndexOf(",")+1);
      if (n<78 || n>80.5) {
         send = true;
      }

      messageBody += dailyState[i];
      messageBody += '<br>';
   }

   if (send) {
      emailer.email(messageBody);
   } 
}

exports.startLogging = function() {
   _readJSON();
   setInterval(function() {
      _getTemperatures();
   }, 5*60000);

   _getTemperatures();

   emailer.email("Temperature logging started at " + new Date().toLocaleString());
}

exports.getTemperatures = function() {
   _getTemperatures();
}


