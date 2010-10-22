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

function useTemplate(response, template, context, contentType) {
    if (!contentType) {
        if (template.match(/^vxml/)) {
            contentType = 'text/plain';
        }
        else {
            contentType = 'text/html';
        }
    }
    mu.render(template, context, {}, function(err, output) {
        if (err) { throw err; }
        response.writeHead(200, {'Content-Type': contentType});
        output.addListener('data', function(c) { response.write(c); });
        output.addListener('end',  function()  { response.end();    });
    });
}

var questions = [
    {},
    { text: 'Multiple choice: What is your favorite programming language? (1) C++ (2) Java (3) perl (4) Python (5) Ruby (6) Haskell (7) Erlang (8) Bourne Shell (9) Other',
      answer: function(given) { return true; }
    },
    { text: 'Spell the word "telephony" on your telephone keypad.',
      answer: '835374669'
    },
    { text: 'How many bits are there in a byte?',
      answer: '8'
    },
    { text: 'How many minutes are there in a typical day?',
      answer: '1440'
    },
    { text: 'What are the first 9 digits of pi?',
      answer: '314159265'
    },
    { text: 'How many volumes of The Art of Computer Programming were published before 1990?',
      answer: '3'
    },
    { text: 'Spell the name of the company running this contest on your telephone keypad.',
      answer: '6272439'
    },
    { text: 'In what year will the Unix epoch time exceed 32 bits?',
      answer: '2038'
    },
    { text: 'How many bits are there in a Java long?',
      answer: '64'
    },
    { text: 'What is the XOR of your phone number and the phone number you called?',
      answer: function(given, caller) { return given == (caller ^ 1234567890); }
    },
    { text: 'How many rooms are there on the Hunt the Wumpus map?',
      answer: '20'
    },
    { text: 'How many  are there in a typical game of Reversi or Othello?',
      answer: '60'
    },
    { text: 'From the Marchex brochures, how many billions of calls are made annually in the United States?',
      answer: '23'
    },
    { text: 'What is the first 9-digit prime palindrome in pi?',
      answer: '318272813'
    },
    { text: 'Consider the shape of a binary tree.  A tree of 2 nodes can have two shapes: left-leaning and right-leaning.  A tree of 3 nodes can have 5 shapes: left-left, left-right, balanced, right-left, and right-right.  A tree of 4 nodes can have 14 shapes.  How many shapes can a tree of 10 nodes have?',
      answer: '16796'
    }
];

var answer_text = {
    true:  "That is correct.",
    false: "That is not correct."
};

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
        useTemplate(response, 'html/register', {});
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
        if (!args.caller_name  ) { args.caller_name   = ''; }
        if (!args.caller_number) { args.caller_number = ''; }
        if (!args.caller_email ) { args.caller_email  = ''; }
        args.caller_number = args.caller_number.replace(/[^\d]/g,'');
        if (!args.caller_name  .match(/^.+$/))                   { errors.push({message: "You must specify your name."                                  }); }
        if (!args.caller_number.match(/^\d\d\d\d\d\d\d\d\d\d$/)) { errors.push({message: "You must specify a 10-digit phone number including area code."}); }
        if (!args.caller_email .match(/^[^@, ]+@[^@, ]+$/))      { errors.push({message: "You must specify a valid email address."                      }); }
        if (errors.length > 0) {
            useTemplate(response, 'html/register', {errors: errors});
            return;
        }
        rclient.getset("quiz:" + args.caller_number + ":active", "true", function(err, reply) {
            if (err) {
                useTemplate(response, 'html/register', {errors: {message: "There was an error storing your data.  Please try again."}});
                return;
            }
            if (reply == "true") {
                useTemplate(response, 'html/register', {errors: {message: "That phone number is already in use.  Please try another."}});
                return;
            }
            rclient.mset("quiz:" + args.caller_number + ":name",             args.caller_name,
                         "quiz:" + args.caller_number + ":number",           args.caller_number,
                         "quiz:" + args.caller_number + ":email",            args.caller_email,
                         "quiz:" + args.caller_number + ":current_question", 0,
                         function(err, reply) {
                if (err) {
                    useTemplate(response, 'html/register', {errors: {message: "There was an error storing your data.  Please try again."}});
                    return;
                }
                useTemplate(response, 'html/register', {success: {message: "Thank you for registering."}});
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
        if (!args.caller) {
            useTemplate(response, 'vxml/no_caller_id', {});
            return;
        }
        rclient.mget("quiz:" + args.caller + ":name",
                     "quiz:" + args.caller + ":number",
                     "quiz:" + args.caller + ":email",
                     "quiz:" + args.caller + ":current_question",
                     function(err, replies) {
            if (err) {
                useTemplate(response, 'vxml/vxml_error', {});
                return;
            }
            var name     = replies[0];
            var number   = replies[1];
            var email    = replies[2];
            var question = replies[3];
            if (number != args.caller) {
	        sys.log("Unregistered caller " + args.caller);
                useTemplate(response, 'vxml/not_registered', {});
                return;
            }
            sys.log("Serving question " + question + " for caller " + args.caller);
            if (question == 0) {
                useTemplate(response, 'vxml/welcome', { caller: args.caller, name: name, nocache: Math.floor(Math.random() * 1000000) });
                rclient.incr("quiz:" + args.caller + ":current_question");
                return;
            }
            if (questions[question]) {
                useTemplate(response, 'vxml/question', { caller: args.caller, name: name, question: question, fallback_tts: questions[question].text, nocache: Math.floor(Math.random() * 1000000) });
                return;
            }
            useTemplate(response, 'vxml/finish', { caller: args.caller, name: name, position: score, nocache: Math.floor(Math.random() * 1000000) });
        });
    },
    '/vxml/answer' : function(request, response, args) {
        if (!args.caller) {
            useTemplate(response, 'vxml/no_caller_id', {});
            return;
        }
        rclient.mget("quiz:" + args.caller + ":name",
                     "quiz:" + args.caller + ":number",
                     "quiz:" + args.caller + ":email",
                     "quiz:" + args.caller + ":current_question",
                     function(err, replies) {
            if (err) {
                useTemplate(response, 'vxml/vxml_error', {});
                return;
            }
            var name     = replies[0];
            var number   = replies[1];
            var email    = replies[2];
            var question = replies[3];
            if (number != args.caller) {
	        sys.log("Unregistered caller " + args.caller);
                useTemplate(response, 'vxml/not_registered', {});
                return;
            }
            if (!questions[question] || !args.answer) {
                useTemplate(response, 'vxml/vxml_error', {});
                return;
            }
            var correct = false;
            if (typeof questions[question].answer == 'function') {
                correct = questions[question].answer(args.answer, args.caller);
            }
            else {
                correct = args.answer == questions[question].answer;
            }
            sys.log("Grading question " + question + " for caller " + args.caller + ": " + correct);
            if (correct) {
                rclient.incr("quiz:" + args.caller + ":current_question");
                question = Math.floor(question) + 1;
            }
            if (questions[question]) {
                useTemplate(response, 'vxml/answer', { caller: args.caller, name: name, answer_status: correct, answer_status_tts: answer_text[correct],
                                                       question: question, fallback_tts: questions[question].text, nocache: Math.floor(Math.random() * 1000000) });
                return;
            }
            var score = 0;
            useTemplate(response, 'vxml/finish', { caller: args.caller, name: name, position: score, nocache: Math.floor(Math.random() * 1000000) });
        });
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
