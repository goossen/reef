var fs = require('fs'),
    path = require('path'),
    gpio = require("pi-gpio"),
    schedule = require('node-schedule');

// Array of current power on/off state, so that clients can be told about this when they connect
var currentState = [];

// TODO Array of scheduled power on/off events, so that they can be canceled if scheduling changes
var timers = [];
//current state of schedule
var currentSchedule;

//TODO allow clients to update schedule.json

//fs.watchFile(path.join(__dirname, 'public/json/schedule.json'), function (curr, prev) {
//   console.log('schedule.json updated');
//   _parseSchedule(path.join(__dirname, 'public/json/schedule.json'));
//});

function _parseSchedule(filename, idToSchedule) {
      _loadJSON(filename, function(response) {
         // Parse JSON string into object
         var json = JSON.parse(response);
        _schedulePower(json, idToSchedule);

        //notify clients of current state of the schedule
        currentSchedule = json;
        app.io.broadcast('schedule', {message: currentSchedule})
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


function _parseSchedule(filename, idToSchedule) {
      _loadJSON(filename, function(response) {
         // Parse JSON string into object
         var json = JSON.parse(response);
        _schedulePower(json, idToSchedule);
      });
}

/*
 * Parse the JSON schedule
 */
function _schedulePower(json, idToSchedule) {
   //iterate over schedule entries in json file
   json.buttons.forEach(function (button) {
      if (button.id === idToSchedule || typeof idToSchedule === "undefined") {
          _scheduleButton(button);
      }
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

   if (currentState.length === 0) {
      //TODO read this in from buttons.json file for those buttons which are not scheduled
      currentState = [
         {"id":"button1", "state":"off"}, 
         {"id":"button2", "state":"off"}, 
         {"id":"button3", "state":"off"}, 
         {"id":"button4", "state":"off"}, 
         {"id":"button5", "state":"off"}, 
         {"id":"button6", "state":"off"},
         {"id":"button7", "state":"off"}, 
         {"id":"button8", "state":"off"} ]
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

//TODO 
function _getGPIO(id) {
//   //get the GPIO pin number
//   var jsonRows = this.buttonsJSON.rows;
//
//   for(var i in jsonRows) {
//      var jsonButtons = jsonRows[i].buttons;
//      for (var j in jsonButtons) {
//         if (jsonButtons[j].id === id) {
//            return jsonButtons[j].gpio;
//         }
//      }
//   }
   if (id === 'button1') {
      return 11;
   } else if (id === 'button2') {
      return 12;
   } else if (id === 'button3') {
      return 13;
   } else if (id === 'button4') {
      return 15;
   } else if (id === 'button5') {
      return 16;
   } else if (id === 'button6') {
      return 18;
   } else if (id === 'button7') {
      return 22;
   } else if (id === 'button8') {
      return 21;
   }
   return -1;

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
exports.readFile = function() {
   fs.readFile(path.join(__dirname, 'public/json/schedule.json'), function (err, file) { 
      if (!err) 
         _parseSchedule(path.join(__dirname, 'public/json/schedule.json'));
      else
         throw err; 
   });
}

exports.getCurrentState = function() {
   return currentState;
}

exports.getCurrentSchedule = function() {
   return currentSchedule;
}

exports.setPower = _setPower
