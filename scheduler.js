var fs = require('fs'),
    path = require('path'),
    gpio = require("pi-gpio"),
    schedule = require('node-schedule');

// Array of current power on/off state, so that clients can be told about this when they connect
var currentState;

//TODO Allow clients to update schedule.json
//Array of scheduled power on/off events, so that they can be canceled if scheduling changes
//var timers = [];

//current state of schedule
var scheduleJSON;

//keep the state of the buttons.json file in memory
var buttonsJSON;

fs.watchFile(path.join(__dirname, 'public/json/buttons.json'), function (curr, prev) {
   console.log('buttons.json updated');
   _readButtons();
});

function _readButtons() {
   _loadJSON(path.join(__dirname, 'public/json/buttons.json'), function(response) {
      this.buttonsJSON = JSON.parse(response);
   });
}

function _readSchedule() {
   _loadJSON(path.join(__dirname, 'public/json/schedule.json'), function(response) {
      // Parse JSON string into object
      var json = JSON.parse(response);
      _schedulePower(json);

      //notify clients of current state of the schedule
      this.scheduleJSON = json;
      app.io.broadcast('schedule', {message: this.scheduleJSON})
   });
}


function _loadJSON(file, callback) {
      fs.readFile(file, 'utf8', function (err, data) {
         if (err) {
            console.log('Error: ' + err);
            return;
         }
         callback(data)
      });
}

/*
 * Parse the JSON schedule
 */
function _schedulePower(json) {
   //iterate over schedule entries in json file
   json.buttons.forEach(function (button) {
       _scheduleButton(button);
   });

   if (!this.initialized) {
      json.buttons.forEach(function (button) {
         _initializeButton(button);
         console.log('initialized ' + button.id);
      });
      this.initialized = true;
   } 
}

/*
 * Parse the JSON schedule for an individual button
 */
function _scheduleButton(button) {
   var id = button.id;
   var jsonSchedule = button.schedule;
   
   console.log('scheduling ' + id);

   //iterate the schedule for this button to find the next time
   for(var i in jsonSchedule) {
      var time = jsonSchedule[i].time;
      var state = jsonSchedule[i].state;

      //set a  new timer for this button
      _scheduleJob(id, time, state);
   }
}

/*
 * Parse the JSON schedule for an initial state of this button
 */
function _initializeButton(button) {
   var id = button.id;
   var jsonSchedule = button.schedule;
   
   var first = true;
   var previousTimeIsPassed = false;
   var set = false;

   console.log('initializing ' + id);

   //iterate the schedule for this button to find the next time
   for(var i in jsonSchedule) {
      var time = jsonSchedule[i].time;
      var state = jsonSchedule[i].state;

      var difference = _getTimeDifference(time);

      //if it is earlier than first time, set schedule
      if (first && difference > 0) {
         //earlier than first time, set schedule
         _setPower(id, _getOppositeState(state));
         set = true;
         break;
      } else {
         if (previousTimeIsPassed && difference > 0) {
            //earlier than this time, and later than previous time, do the opposite and set schedule
            _setPower(id, _getOppositeState(state));
            set = true;
            break;
         }
      }

      first = false;
      if (difference < 0) {
         previousTimeIsPassed = true;
      }
   }

   if (!set) {
      var time = jsonSchedule[0].time;
      var state = jsonSchedule[0].state;
      //not set, use first time tomorrow, set schedule
      _setPower(id, _getOppositeState(state));
   }
}

function _getOppositeState(state) {
   var oppositeState = state === 'on' ? 'off' : 'on';
   return oppositeState;
}

/*
 * Create a timer for this button and time
 */
function _scheduleJob(id, time, state) {
   console.log('   ' + 'scheduling ' + state + ' at ' + time);
   var res = time.split(":");

   var rule = new schedule.RecurrenceRule();
   rule.hour = parseInt(res[0]);
   rule.minute = parseInt(res[1]);

   var j = schedule.scheduleJob(rule, function(){
      _setPower(id, state);
   });
}

function _setPower(id, state) {
   if (currentState === undefined || currentState.length === 0) {
      //read this in from buttons.json file for those buttons which are not scheduled
      var jsonRows = this.buttonsJSON.rows;

      currentState = [];
      var counter = 0;
      for(var i in jsonRows) {
         var jsonButtons = jsonRows[i].buttons;
         for (var j in jsonButtons) {
            var id = jsonButtons[j].id;
            var state = jsonButtons[j].state;
            if (state === 'variable') {
               state = 'off';
            } else {
               //power on or off, according to buttons.json
               _turnOnOff(id, state);
            }
            currentState[counter++] = {"id":id, "state":state};
         }
      }
   }

   //just set the power
   var newState = [];
   for (var i = 0; i < currentState.length; i++) {
      if (currentState[i].id === id) {
         newState[i] = {"id":id, "state":state};
         _turnOnOff(id, state);
      } else {
         newState[i] = currentState[i];
      }
   }
   currentState = newState;

   app.io.broadcast('power', {message: currentState})
}

function _turnOnOff(id, state) {
   console.log('turning ' + id + ' ' + state);
   var pin = _getGPIO(id);
   gpio.open(pin, 'output', function(err) {     // Open pin for output
      if (state === 'on') {
         gpio.write(pin, 1, function() {        // Set pin to high (1)
            gpio.close(pin);                    // Close pin
         });
      } else {
         gpio.write(pin, 0, function() {        // Set pin to low (0)
            gpio.close(pin);                    // Close pin
         });
      }
   });
}

function _getGPIO(id) {
   //get the GPIO pin number
   var jsonRows = this.buttonsJSON.rows;

   for(var i in jsonRows) {
      var jsonButtons = jsonRows[i].buttons;
      for (var j in jsonButtons) {
         if (jsonButtons[j].id === id) {
            return jsonButtons[j].gpio;
         }
      }
   }
}

/*
 * Take a time String and calculates the difference in ms from the current time.
 */
function _getTimeDifference(time) {

   //current time in ms since 1970
   var time1=new Date();
   var time1ms= time1.getTime(time1); //i get the time in ms  

   //the time is a String, such as "13:30" in ms since 1970
   var res = time.split(":");
   var time2 = new Date();
   time2.setHours(res[0], res[1], 0, 0);
   var time2ms= time2.getTime(time2); 

   return(time2ms-time1ms);
}

/* Public API */
exports.readFiles = function() {
   _readButtons();
   _readSchedule();
}

exports.getCurrentState = function() {
   return currentState;
}

exports.getCurrentSchedule = function() {
   return this.scheduleJSON;
}

exports.setPower = _setPower
