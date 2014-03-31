var sense = require('ds18b20');

var connect = require('connect'),
    http = require('http'),
    url = require('url');

var app = connect()
  .use(connect.static(__dirname))
  .use(function(request, response){

    if(request.method=='GET') {
      sense.temperature('28-000005be269d', function(err, value) {
         response.end(value);
      });
    } else if(request.method=='PUT') {
      var url_parts = url.parse(request.url, true);
      var query = url_parts.query;

      // gpio 7, 11, 12, 13, 15, 16, 18, 22
      var open=query.open;
      var close=query.close;

      response.end('open: ' + open + '\n' + 'close: ' + close + '\n');
    }



  });

connect.createServer(app).listen(8888);
