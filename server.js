var express = require('express.io'), 
    path = require('path'),
    url = require('url'),
    sense = require('ds18b20'),
    fs = require('fs');

app = require('express.io')()
app.http().io()

//TODO keep an array of scheduled power on/off events, so that clients can be told about these when they connect

// Configure server
app.configure(function(){
   app.use(express.logger('dev'));
   app.use(express.static(path.join(__dirname, 'public')));

   //read all schedule .json files
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
});

// Setup the ready route, and emit talk event.
app.io.route('ready', function(req) {
    req.io.emit('talk', { 
        message: 'io event from an io route on the server'
    })

})

// Send the client html.
app.get('/', function(req, res) { 
    res.sendfile(__dirname + '/index.html')
})


/*
 * Log the temperation at a set interval
 */
setInterval(function() {
    _getTemperature();
  }, 15000);

function _getTemperature() {
    sense.temperature('28-000005be269d', function(err, value) {
         if (err) {
           value = 0;
         }

         app.io.broadcast('temperature', {message: '28-000005be269d' + ':' +  value})
      });
}

app.put('/', function(req, res) { 
      var url_parts = url.parse(req.url, true);
      var query = url_parts.query;

      // gpio 7, 11, 12, 13, 15, 16, 18, 22
      var open=query.open;
      var close=query.close;

      res.end('open: ' + open + '\n' + 'close: ' + close + '\n');
})

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

function _setPower(id, state, difference) {
   app.io.broadcast('power', {message: 'id' + ':' +  id + '-'+ state})
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

app.listen(8888)
