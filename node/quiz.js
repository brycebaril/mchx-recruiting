var ws = require("websocket-server"),
    http = require('http'),
    form = require('../lib/www-forms.js'),
    url = require('url'),
    querystring = require('querystring'),
    redis = require('redis'),
    mu = require('mu'),
    sys = require('sys');

mu.templateRoot = '../templates';

var wsport = 8008;
var webport = 8080;

var wsserver = ws.createServer();
var rclient = redis.createClient();

function useTemplate(response, template, context) {
    mu.render(template, context, {}, function(err, output) {
        if (err) { throw err; }
        response.writeHead(200, {'Content-Type': 'text/html'});
        output.addListener('data', function(c) { response.write(c); });
        output.addListener('end',  function()  { response.end();    });
    });
}

var getRoutes = {
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
    '/register' : function(request, response) {
        useTemplate(response, 'register', {});
    },
    '/vxml' : function(request, response) {
        response.writeHead(200, {'Content-Type': 'text/plain'});
        response.end('vxml placeholder');
    },
};

function redirect(response, location, args) {
    var encoded = new Array();
    for (var key in args) {
        encoded.push(querystring.escape(key) + "=" + querystring.escape(args[key]));
    }
    if (encoded.length > 0) {
        location = location + '?' + encoded.join('&');
    }
    response.writeHead(302, {'Location': location, 'Content-Type': 'text/html'});
    response.write('<html><head><title>Moved</title></head><body><a href="' + location +'">Oops.</a></body></html>');
    response.end();
}

var postRoutes = {
    '/' : function(request, response, args) {
        response.writeHead(200, {'Content-Type': 'text/plain'});
        response.end('placeholder');
    },
    '/register' : function(request, response, args) {
        var errors = new Array();
        if (!args.caller_name  .match(/^.+$/))                             { errors.push({message: "You must specify your name."                                  }); }
        if (!args.caller_number.match(/^\(?\d\d\d\)?-?\d\d\d-?\d\d\d\d$/)) { errors.push({message: "You must specify a 10-digit phone number including area code."}); }
        if (!args.caller_email .match(/^[^@, ]+@[^@, ]+$/))                { errors.push({message: "You must specify a valid email address."                      }); }
        if (errors.length > 0) {
            useTemplate(response, 'register', {errors: errors});
            return;
        }
        rclient.getset("quiz:" + args.caller_number + ":active", "true", function(err, reply) {
            if (reply == "true") {
                useTemplate(response, 'register', {errors: {message: "That phone number is already in use.  Please try another."}});
                return;
            }
            rclient.mset("quiz:" + args.caller_number + ":name",             args.caller_name,
                         "quiz:" + args.caller_number + ":number",           args.caller_number,
                         "quiz:" + args.caller_number + ":email",            args.caller_email,
                         "quiz:" + args.caller_number + ":current_question", 0,
                         function(err, reply) {
                if (err) {
                    useTemplate(response, 'register', {errors: {message: "There was an error storing your data.  Please try again."}});
                    return;
                }
                useTemplate(response, 'register', {success: {message: "Thank you for registering."}});
            });
        });
    },
    '/ping' : function(request, response, args) {
        response.writeHead(200, {
            "Content-Type": "text/plain"
        });
        response.write("Call from " + args.caller_name + " <"+ args.caller_number + "> (calling: " + args.called_number + ") complete.  Status: " + args.call_status);
        response.end();
    },
    '/vxml/question' : function(request, response, args) {
        response.writeHead(200, {'Content-Type': 'text/plain'});
        response.write("User-agent: discobot\n");
        response.write("Disallow: /\n");
        response.write("User-agent: *\n");
        response.write("Disallow: /\n");
        response.end();
    },
    '/vxml' : function(request, response, args) {
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
        var pathname = url.parse(request.url).pathname;
        if (postRoutes[pathname] === undefined) {
            not_found(request, response);
        }
        else {
            post_handler(request, function(request_data) { postRoutes[pathname].call(this, request, response, request_data) });
        }
//        
//        post_handler(request, function(request_data) {
//            response.writeHead(200, {
//                "Content-Type": "text/plain"
//            });
//            response.write("Call from " + request_data.caller_name + " <"+ request_data.caller_number + "> (calling: " + request_data.called_number + ") complete.  Status: " + request_data.call_status);
//            response.end();
//            sys.log("POST-a-licious");
//            // incr for vote, then broadcast new counts
//            if (request_data.call_status) {
//                wsserver.broadcast("Call from " + request_data.caller_name + " <"+ request_data.caller_number + "> (calling: " + request_data.called_number + ") complete.  Status: " + request_data.call_status);
//            }
//            else {
//                wsserver.broadcast("Incoming call from: " + request_data.caller_number + " (calling: " + request_data.called_number + ") acc/cmp: " + request_data.acc + "/" + request_data.cmp);
//            }
//        });
    }
    else if (request.method == 'GET') {
        // send vxml
        // based off query params?
        var pathname = url.parse(request.url).pathname;
        if (getRoutes[pathname] === undefined) {
            not_found(request, response);
        }
        else {
            getRoutes[pathname].call(this, request, response);
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
        request.addListener('end', function() {
            callback(querystring.parse(_content));
        });
    }
}




// GET hanlders:
//     vxml
//     scoreboard
// POST handler:
//     (smart enough to ignore irrelevant stuff)
