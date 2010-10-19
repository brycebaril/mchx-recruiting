var http = require('http'),
    sys = require('sys');

var port = 8080;

var server = http.createServer(function (req, res) {
    sys.log(req.url);
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('pong');
}).listen(port);

sys.log('pong repeater running at port '+port);
