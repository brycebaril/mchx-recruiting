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

var inbound_number = "8007244683";

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
        if (err) { sys.log('ERROR: ' + err); return; }
        response.writeHead(200, {'Content-Type': contentType});
        output.addListener('data', function(c) { response.write(c); });
        output.addListener('end',  function()  { response.end();    });
    });
}

var questions = [
    {},
    { text: 'Multiple choice: What is your favorite programming language? 1 C plus plus 2 Java 3 Perl 4 Python 5 Ruby 6 Haskell 7 Erlang 8 Javascript 9 Other',
      answer: function(given) { return true; }
    },
    { text: 'About how many University of Washington Computer Science and Engineering undergraduate students graduate each year 50 100 160 or 250?',
      answer: '160'
    },
    { text: 'How many bits are there in a byte?',
      answer: '8'
    },
    { text: 'Spell the name of the company running this contest on your telephone keypad.',
      answer: '6272439'
    },
    { text: 'How many bits are there in a Java long?',
      answer: '64'
    },
    { text: 'How many minutes are there in a typical day?',
      answer: '1440'
    },
    { text: 'What are the first 9 digits of pi?',
      answer: '314159265'
    },
    { text: 'What is the HTTP error code for File Not Found?',
      answer: '404'
    },
    { text: 'In what year will the Unix epoch time exceed 32 bits?',
      answer: '2038'
    },
    { text: 'When rolling 2 six-sided dice, you should expect to roll a total of 5 about one roll in every how many rolls?',
      answer: '9'
    },
    { text: 'What is 42 in binary?',
      answer: '101010'
    },
    { text: 'How many prime numbers are there between 100 and 1000?',
      answer: '143'
    },
    { text: 'What is the bitwise XOR of the last four digits of your phone number and the last four digits of the phone number you called?',
      answer: function(given, caller) { var xored = caller.substr(-4,4) ^ inbound_number.substr(-4,4); sys.log("expect: " + xored); return given == xored; }
    },
    { text: 'What is the first 9 digit prime palindrome in pi?',
      answer: '318272813'
    },
    { text: 'Consider the shape of a binary tree.  A tree of 2 nodes can have two shapes left leaning and right leaning.  A tree of 3 nodes can have 5 shapes left left, left right, balanced, right left, and right right.  A tree of 4 nodes can have 14 shapes.  How many shapes can a tree of 10 nodes have?',
      answer: '16796'
    }
];

var answer_text = {
    true:  "That is correct.",
    false: "That is not correct."
};

var routes = {
    '/' : function(request, response, args) {
        response.writeHead(200, {'Content-Type': 'text/plain'});
        drawFullScoreboard(response);
    },
    '/ping' : function(request, response, args) {
        // update the scoreboard
        //wsScoreBoard('');
        response.writeHead(200, {'Content-Type': 'text/plain'});
        response.end('pong');
    },
    '/robots.txt' : function(request, response, args) {
        response.writeHead(200, {'Content-Type': 'text/plain'});
        response.write("User-agent: discobot\n");
        response.write("Disallow: /\n");
        response.write("User-agent: *\n");
        response.write("Disallow: /\n");
        response.end();
    },
    '/register' : function(request, response, args) {
        if (request.method == 'GET') {
            sys.log('Loading register page');
            useTemplate(response, 'html/register', {});
            return;
        }
        sys.log('Processing new registrant');
        var errors = new Array();
        if (!args.caller_name  ) { args.caller_name   = ''; }
        if (!args.caller_number) { args.caller_number = ''; }
        if (!args.caller_email ) { args.caller_email  = ''; }
        args.caller_number = args.caller_number.replace(/[^\d]/g,'');
        if (!args.caller_name  .match(/^.+$/))                   { errors.push({message: "You must specify your name."                                  }); }
        if (!args.caller_number.match(/^\d\d\d\d\d\d\d\d\d\d$/)) { errors.push({message: "You must specify a 10-digit phone number including area code."}); }
        if (!args.caller_email .match(/^[^@, ]+@[^@, ]+$/))      { errors.push({message: "You must specify a valid email address."                      }); }
        if (errors.length > 0) {
            sys.log('Failed registration: ' + sys.inspect(errors));
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
            rclient.hmset("quiz:" + args.caller_number,
                          "name",     args.caller_name,
                          "number",   args.caller_number,
                          "email",    args.caller_email,
                          "question", 0,
                          function(err, reply) {
                if (err) {
                    useTemplate(response, 'html/register', {errors: {message: "There was an error storing your data.  Please try again."}});
                    rclient.del("quiz:" + args.caller_number + ":active");
                    return;
                }
                useTemplate(response, 'html/register', {success: {message: "Thank you for registering.  You can now call (800) 724-4683 from your registered number to play!"}});
                sys.log("Registered " + args.caller_number + " for " + args.caller_name + " with email " + args.caller_email);
                rclient.zcount("quiz:score", -100000000, 100000000, function(err, reply) {
                    // zset for rank calculation
                    // score entry in hash for easier recall via SORT
                    rclient.hset("quiz:" + args.caller_number, "score", -reply);
                    rclient.hset("quiz:" + args.caller_number, "correct", 0);
                    rclient.zadd("quiz:score", -reply, args.caller_number);
                    // update the scoreboard
                    wsScoreBoard(args.caller_name + ' just registered.');
                });
            });
        });
    },
    '/vxml/question' : function(request, response, args) { handleQuestion(request, response, args); },
    '/vxml/answer'   : function(request, response, args) { handleQuestion(request, response, args); },
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

function handleQuestion(request, response, args) {
    if (!args.caller) {
        useTemplate(response, 'vxml/no_caller_id', {});
        return;
    }
    rclient.hmget("quiz:" + args.caller,
                  "name", "number", "email", "question",
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
        var template = 'vxml/question';
        var correct = false;
        if (question == 0) {
            sys.log("Playing welcome for caller " + args.caller);
            template = 'vxml/welcome';
            correct = true;
        }
        if (questions[question] && args.answer !== undefined) {
            template = 'vxml/answer';
            if (typeof questions[question].answer == 'function') {
                correct = questions[question].answer(args.answer, args.caller);
            }
            else {
                correct = args.answer == questions[question].answer;
            }
            sys.log("Grading question " + question + " for caller " + args.caller + "(answer: " + args.answer + "): " + correct);
        }
        if (correct) {
            var old = question;
            question = Math.floor(question) + 1;
            rclient.hset("quiz:" + args.caller, "question", question);
            rclient.incr("quiz:correct:" + old, function(err, reply) {
                var score = question * 1000000 - reply;
                sys.log("Setting score for caller " + args.caller + " to " + score);
                rclient.hset("quiz:" + args.caller, "score", score);
                rclient.hset("quiz:" + args.caller, "correct", question - 1);
                rclient.zadd("quiz:score", score, args.caller, function(err, reply) {
                    handleQuestion2(request, response, args, name, number, email, question, template, correct);
                });
                // update the scoreboard
                wsScoreBoard(name + " just answered question " + (question - 1) + ' correctly!');
            });
        } else {
            handleQuestion2(request, response, args, name, number, email, question, template, correct);
            if (args.answer !== undefined) {
                wsScoreBoard(name + " just answered question " + question + ' incorrectly...');
            }
            else {
                wsScoreBoard(name + ' is working on question ' + question);
            }
        }
    });
}

// How I wish for callWithCurrentContinuation
function handleQuestion2(request, response, args, name, number, email, question, template, correct) {
    var fallback = '';
    if (questions[question] === undefined) {
        template = 'vxml/finish';
        sys.log("Playing finish for caller " + args.caller);
    }
    else {
        sys.log("Serving question " + question + " for caller " + args.caller);
        fallback = questions[question].text;
    }

    rclient.zrevrank("quiz:score", args.caller, function(err, reply) {
        if (reply === null) {
            reply = "last";
        }
        else {
            reply = Math.floor(reply) + 1;
        }
        //sys.log("position: " + reply);
        useTemplate(response, template, { caller: args.caller, name: name,
                                          position: reply,
                                          answer_status: correct, answer_status_tts: answer_text[correct],
                                          question: question, fallback_tts: fallback,
                                          nocache: Math.floor(Math.random() * 1000000) });
    });
}

function notFound(request, response) {
    response.writeHead(404, {'Content-Type': 'text/plain'});
    response.end('Not here.');
}

wsserver.addListener("connection", function(connection){
    // collect current votes and display those
    // how to distinguish between different polls?
    //connection.send("Connected. Waiting for votes...");
    wsScoreBoard('');
});

wsserver.addListener("error", function(connection, error) {
    // library has no documentation for this, nor do I know how to trigger it.
    // this may do nothing.
    sys.log("got a websocket error.  weird.");
});

process.on('uncaughtException', function (err) {
    sys.log('Caught exception: ' + err);
});

wsserver.listen(wsport);
sys.log("ws: listening on " + wsport);

// listen for posts, and then broadcast messages to ws clients
var webserver = http.createServer(function (request, response) {
    if (request.method == 'POST' || request.method == 'GET') {
        var pathname = url.parse(request.url).pathname;
        if (routes[pathname] === undefined) {
            notFound(request, response);
        }
        else {
            if (request.method == 'GET') {
                var args = querystring.parse(url.parse(request.url).query);
                routes[pathname].call(this, request, response, args);
            }
            else {
                // POST
                post_handler(request, function(request_data) { routes[pathname].call(this, request, response, request_data) });
            }
        }
    }
    else {
        // could parse any query params here
        sys.log("Handled a " + request.method + ".  Huh.  Didn't expect that. Gave 'em a 404.");
        notFound(request, response);
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

// draws the full scoreboard page
function drawFullScoreboard(response) {
    // needs {scores: [ {name: ..., score: ...}, ]}
    getScoreboard(function (err, reply) {
        if (err) {
            useTemplate(scoreboard, 'html/scoreboard', {});
            return;
        }
        // note using current question as score (off by one?) hence the name mismatch here
        var scoreboard = {};
        scoreboard["scores"] = replyToListOfHashes(['name', 'score'], reply);
        useTemplate(response, 'html/scoreboard', scoreboard);
    });
}

// only draws the internal div
function wsScoreBoard(msg) {
    // needs {scores: [ {name: ..., score: ...}, ]}
    sys.log("Updating websocket scoreboards");
    getScoreboard(function (err, reply) {
        if (err) {
            // just don't send any data
            sys.log("error trying to publish a scoreboard via websockets - not doing anything");
            return;
        }
        // note using current question as score (off by one?) hence the name mismatch here
        var scoreboard = {msg: msg};
        scoreboard["scores"] = replyToListOfHashes(['name', 'score'], reply);

        mu.render('html/scoreboard_div', scoreboard, {}, function(err, output) {
            if (err) { throw err; }
            var _content = '';
            output.addListener('data', function(c) { _content += c;       });
            output.addListener('end',  function()  { wsserver.broadcast(_content)});
        });
    });
}

function getScoreboard(callback) {
    rclient.sort('quiz:score', 'get', 'quiz:*->name', 'get', 'quiz:*->correct', 'by', 'quiz:*->score', 'desc', callback);
}

function replyToListOfHashes(proto, list) {
    var r = [];
    // I'm awfully used to Perl, is there no better way?
    var proto_loc = 0;
    var entry = {};
    for (var value in list) {
        var key = proto[proto_loc];
        entry[key] = list[value].toString();
        proto_loc++;
        if (proto_loc >= proto.length) {
            proto_loc = 0;
            r.push(entry);
            entry = {};
        }
    }
    return r;
}


// GET hanlders:
//     vxml
//     scoreboard
// POST handler:
//     (smart enough to ignore irrelevant stuff)
