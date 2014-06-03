var fs = require('fs'),
    path = require('path');

fs.watchFile(path.join(__dirname, 'public/maintenance.log'), function (curr, prev) {
   console.log('maintenance.log updated');
   _getLog();
});

function _getLog() {
   _loadFile(path.join(__dirname, 'public/maintenance.log'), function(response) {
  
      app.io.broadcast('maintenance', {message: response})
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

/* Public API */
exports.getLog = function() {
   _getLog();
}
