var ws = require("websocket-server"),
    http = require('http'),
    form = require('/home/ubuntu/quiz/lib/www-forms.js'),
    url = require('url'),
    sys = require('sys');

var wsport = 8008;
var webport = 8080;

var wsserver = ws.createServer();

var routes = {
    '/' : function(request, response) {
        response.writeHead(200, {'Content-Type': 'text/plain'});
        response.end('placeholder');
    },
    '/ping' : function(request, response) {
        response.writeHead(200, {'Content-Type': 'text/plain'});
        response.end('pong');
    },
    '/robots.txt' : function(request, response) {
        response.writeHead(200, {'Content-Type': 'text/plain'});
        response.write("User-agent: discobot\n");
        response.write("Disallow: /\n");
        response.write("User-agent: *\n");
        response.write("Disallow: /\n");
        response.end();
    },
    '/vxml' : function(request, response) {
        response.writeHead(200, {'Content-Type': 'text/plain'});
        response.end('vxml placeholder');
    },
};

function not_found(request, response) {
    response.writeHead(404, {'Content-Type': 'text/plain'});
    response.end('Not here.');
}

wsserver.addListener("connection", function(connection){
    // collect current votes and display those
    // how to distinguish between different polls?
    connection.send("Connected. Waiting for votes...");
});

wsserver.listen(wsport);
sys.log("ws: listening on " + wsport);

// listen for posts, and then broadcast messages to ws clients
var webserver = http.createServer(function (request, response) {
    if (request.method == 'POST') {
        post_handler(request, function(request_data) {
            response.writeHead(200, {
                "Content-Type": "text/plain"
            });
            response.end("ok");
            sys.log("POST-a-licious");
            // incr for vote, then broadcast new counts
            if (request_data.call_status) {
                wsserver.broadcast("Call from " + request_data.caller_name + " <"+ request_data.caller_number + "> (calling: " + request_data.called_number + ") complete.  Status: " + request_data.call_status);
            }
            else {
                wsserver.broadcast("Incoming call from: " + request_data.caller_number + " (calling: " + request_data.called_number + ") acc/cmp: " + request_data.acc + "/" + request_data.cmp);
            }
        });
    }
    else if (request.method == 'GET') {
        // send vxml
        // based off query params?
        var pathname = url.parse(request.url).pathname;
        if (routes[pathname] === undefined) {
            not_found(request, response);
        }
        else {
            routes[pathname].call(this, request, response);
        }
    }
    else {
        // could parse any query params here
        sys.log("Handled a " + request.method + ".  Huh.  Didn't expect that. Gave 'em a 404.");
        not_found(request, response);
    }

}).listen(webport);
sys.log("http: listening on " + webport);


function post_handler(request, callback) {
    var _request = {};
    var _content = '';

    if (request.method == 'POST') {
        request.addListener('data', function(c) {
            _content += c;
        });
    }
}




// GET hanlders:
//     vxml
//     scoreboard
// POST handler:
//     (smart enough to ignore irrelevant stuff)
