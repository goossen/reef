var sense = require('ds18b20');

exports.startLogging = function() {
   setInterval(function() {
      _getTemperature();
   }, 15000);
}

function _getTemperature() {
   sense.temperature('28-000005be269d', function(err, value) {
      if (err) {
         value = 0;
      }

      var tempF=value * 9 / 5 + 32;
      app.io.broadcast('temperature', {message: '28-000005be269d' + ':' +  Math.round(tempF * 10) / 10})
   });
}

