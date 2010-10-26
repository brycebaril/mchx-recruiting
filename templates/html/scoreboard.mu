{{>html/header}}
    <h2><br />Make History Quiz - Scoreboard</h2>
    {{>html/scoreboard_div}}
    <div class="sub_topic">
    <a href="register">Register here</a>
    <br />
    The call-in number for the quiz is: (800) 724-4683
    <br />
    <br />
    <br />
    Quiz Powered by:
    <br />
    <img src="img/mca.jpg"/>
    <br />
    <img src="img/node.png"/>
    <br />
    <img src="img/redis.png"/>
    <br />
    <img src="img/jquery.png"/>
    <br />
    <img src="img/nginx.png"/>
    </div>
    <script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js"></script>
    <script type="text/javascript">

    $(function() {
        var conn;

        function replaceScoreboard(msg) {
            $("#scoreboard").replaceWith(msg)
            var d = $("#scoreboard")[0]
            var doScroll = d.scrollTop == d.scrollHeight - d.clientHeight;
            if (doScroll) {
                d.scrollTop = d.scrollHeight - d.clientHeight;
            }
        }

        if (window["WebSocket"]) {
            conn = new WebSocket("ws://uw.makehistory.com:8008/ws");
            conn.onclose = function(evt) {
                $("<div><b>Connection closed.</b></div>").appendTo($("#scoreboard"));
            }
            conn.onmessage = function(evt) {
                //replaceScoreboard(evt.data)
                $("#scoreboard").replaceWith(evt.data)
            }
        }
        else {
            $("<div><b>Your browser does not support WebSockets. Try Google Chrome or Safari.</b></div>").appendTo($("#scoreboard"))
        }
    });

    </script>
{{>html/footer}}
