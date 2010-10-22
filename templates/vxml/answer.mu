<?xml version="1.0" encoding="UTF-8"?>
<vxml version="2.0">

<form id="welcome">
<block>
    <audio src="http://uw.makehistory.com/audio/{{answer_status}}.gsm">
    {{answer_status_tts}}
    </audio>
    <goto next="#question"/>
</block>
</form>
{{>question_form}}
</vxml>
