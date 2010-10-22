<?xml version="1.0" encoding="UTF-8"?>
<vxml version="2.0">

<var nocache = "{{nocache}}"/>
<form id="sorry">
<block>
    <audio src="http://uw.makehistory.com/audio/welcome.gsm">
    Hello, {{name}}.
    This is just filler text.  We should tell people how to play.  It would be nice.
    </audio>
    <submit next="http://uw.makehistory.com/vxml/question"
            method="post"
            namelist="caller nocache"/>
</block>
</form>
</vxml>
