<?xml version="1.0" encoding="UTF-8"?>
<vxml version="2.0">

<form id="welcome">
<block>
    Welcome back, {{name}} you are on question {{question}}.
    <goto next="#question"/>
</block>
</form>
{{>question_form}}
</vxml>
