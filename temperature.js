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

      app.io.broadcast('temperature', {message: '28-000005be269d' + ':' +  value})
   });
}

