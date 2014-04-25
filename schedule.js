var fs = require('fs'),
    path = require('path');

// Array of scheduled power on/off events, so that clients can be told about these when they connect
var currentState = [];

exports.readFiles = function() {
   fs.readdir('public/json/schedule/', function (err, files) { 
      if (!err) 
         files.forEach(function (filename) {
            if (filename && filename.indexOf('.json') !== -1) {
               _parseSchedule('public/json/schedule', filename)
            }
         });
      else
         throw err; 
   });
}

fs.watch('public/json/schedule', function (event, filename) {
      if (filename && filename.indexOf('.json') !== -1) {
         _parseSchedule('public/json/schedule', filename)
      }
});

function _parseSchedule(dir, filename) {
      console.log(filename + ' updated');
      _loadJSON(path.join(dir, filename), function(response) {
         // Parse JSON string into object
         var json = JSON.parse(response);
         var id = filename.substr(0, filename.indexOf('.'));
        _schedulePower(id, json);
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

function _schedulePower(id, json) {

   //iterate over on&off entries in json file
   var jsonSchedule = json.schedule;

   var first = true;
   var previousTimeIsPassed = false;
   var set = false;

   for(var i in jsonSchedule) {
	var time = jsonSchedule[i].time;
	var state = jsonSchedule[i].state;

        var difference = _getTimeDifference(time);

        //if it is earlier than first time, set schedule
        if (first && difference > 0) {
            //earlier than first time, set schedule
            console.log(id + " scheduled for " + state + " at " + time);
            _setPower(id, state, difference);
            set = true;
            break;
        } else {
           if (previousTimeIsPassed && difference > 0) {
              //earlier than this time, and later than previous time, do the opposite and set schedule
              console.log(id + " scheduled for " + state + " at " + time);
              _setPower(id, state, difference);
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
      //not set, use first time, set schedule
      console.log (id + " scheduled for " + jsonSchedule[0].state + " at " + jsonSchedule[0].time + " tomorrow");
      var difference = _getTimeDifference(jsonSchedule[0].time);
      difference = difference + 24*60*60*1000;
      _setPower(id, jsonSchedule[0].state, difference);
   }
}

exports.getCurrentState = function() {
   return currentState;
}

exports.setPower = _setPower

function _setPower(id, state, difference) {

   //if the current state is the same as the next scheduled state, do the opposite
   if (currentState.length === 0) {
      currentState = [
         {"id":"button1", "state":"on"}, 
         {"id":"button2", "state":"off"}, 
         {"id":"button3", "state":"off"}, 
         {"id":"button4", "state":"off"}, 
         {"id":"button5", "state":"on"}, 
         {"id":"button6", "state":"off"},
         {"id":"button7", "state":"off"}, 
         {"id":"button8", "state":"off"} ]
    }

   //TODO update currentstate if difference is 0;
   //else start a timer
   if (difference === 0) {
      var newState = [];
      for (var i = 0; i < currentState.length; i++) {
         if (currentState[i].id === id) {
            newState[i] = {"id":id, "state":state};
         } else {
            newState[i] = currentState[i];
         }
      }
      currentState = newState;
   }

   app.io.broadcast('power', {message: currentState})
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
