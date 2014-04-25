var express = require('express.io'), 
    url = require('url'),
    path = require('path');

var temp = require('./temperature.js'),
    schedule = require('./schedule.js');

app = require('express.io')()
app.http().io()

// Configure server
app.configure(function(){
   app.use(express.logger('dev'));
   app.use(express.static(path.join(__dirname, 'public')));

   //read all schedule .json files
   schedule.readFiles();

   // Log the temperation at a set interval
   temp.startLogging();
});

// Setup the ready route, and emit talk event.
app.io.route('ready', function(req) {
   var currentState = schedule.getCurrentState();
   req.io.emit('power', { 
      message: currentState
   })
})

// Send the client html.
app.get('/', function(req, res) { 
    res.sendfile(__dirname + '/index.html')
})

// REST API
// Turn on/off power
app.put('/', function(req, res) { 
      var url_parts = url.parse(req.url, true);
      var query = url_parts.query;

      // gpio 7, 11, 12, 13, 15, 16, 18, 22

      console.log(query);

      //TODO get state, get gpio
      schedule.setPower(query.id, query.state, 0);

      res.end('200\n');
})

app.listen(8888)
