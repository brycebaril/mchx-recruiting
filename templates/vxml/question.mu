<?xml version="1.0" encoding="UTF-8"?>
<vxml version="2.0">

<property name="timeout" value="30s"/>
<property name="bargein" value="true"/>
<property name="ttsfetchtimeout" value="10s"/>

<form id="welcome">
<block>
    Welcome back, {{name}} you are on question {{question}}.
    <goto next="#question"/>
</block>
</form>
{{>vxml/question_form}}
</vxml>
