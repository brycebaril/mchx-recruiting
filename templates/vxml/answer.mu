<?xml version="1.0" encoding="UTF-8"?>
<vxml version="2.0">

<property name="timeout" value="4s"/>
<property name="termtimeout" value="20s"/>
<property name="interdigittimeout" value="20s"/>
<property name="bargein" value="true"/>
<property name="ttsfetchtimeout" value="10s"/>

<form id="welcome">
<var name="position" expr="{{position}}"/>
<block>
    <audio src="http://uw.makehistory.com/audio/{{answer_status}}.gsm">
    {{answer_status_tts}}
    </audio>
    <goto next="#question"/>
</block>
</form>
{{>vxml/question_form}}
</vxml>
