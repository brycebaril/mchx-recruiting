<form id="question">
<var question = "{{question}}"/>
<var caller = "{{caller}}"/>
<var nocache = "{{nocache}}"/>
<field name="answer" type="digits">
    <prompt>
        <audio src="http://uw.makehistory.com/audio/{{question}}.gsm">
        {{fallback_tts}}
        </audio>
    </prompt>
</field>
<field name="ok" type="boolean">
    <prompt>
        <audio src="http://uw.makehistory.com/audio/you_entered.gsm">
        You entered
        </audio>
        <value expr="answer"/>
        <audio src="http://uw.makehistory.com/audio/press_1.gsm">
        Press 1 to accept, 2 to reenter.
        </audio>
    </prompt>
    <if cond="!ok">
    <else/>
        <submit next="http://uw.makehistory.com/vxml/answer"
            method="get"
            namelist="question answer caller nocache"/>
    </if>
</field>
</form>
