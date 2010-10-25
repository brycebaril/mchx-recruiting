<form id="question">
<var name="question" expr="{{question}}"/>
<var name="caller" expr="{{caller}}"/>
<var name="nocache" expr="{{nocache}}"/>
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
        <value expr="answer.split('').join(' ')"/>
        <audio src="http://uw.makehistory.com/audio/press_1.gsm">
        Press 1 to accept, or 2 to reenter.
        </audio>
    </prompt>
    <filled>
        <if cond="!ok">
            <clear/>
        <else/>
            <submit next="http://uw.makehistory.com/vxml/answer"
                method="get"
                namelist="question answer caller nocache"/>
        </if>
    </filled>
</field>
</form>
