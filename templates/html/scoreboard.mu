<html>
    <head>
    <title>Marchex Make History Quiz - University of Washington Career Fair</title>
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
                replaceScoreboard("<div><b>Connection closed.</b></div>")
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
    </head>

    <body>
        <!-- todo makehistory/marchex logo -->
        <h1>Marchex Make History Quiz - University of Washington Career Fair</h1>
        <div id="scoreboard">
        {{>html/scoreboard_div}}
        </div>
        <!-- TODO logos, link to registration, phone number, etc. -->
        <!-- powered by Marchex Call Analytics, Node.js, jQuery, Redis, Nginx -->
    </body>
</html>
