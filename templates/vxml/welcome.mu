<?xml version="1.0" encoding="UTF-8"?>
<vxml version="2.0">

<var nocache = "{{nocache}}"/>
<form id="sorry">
<block>
    Hello, {{name}}.
    <audio src="http://uw.makehistory.com/audio/welcome.gsm">
    This is just filler text.  We should tell people how to play.  It would be nice.
    </audio>
    <goto next="#question"/>
</block>
</form>
{{>vxml/question_form}}
</vxml>
