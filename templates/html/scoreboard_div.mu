<div id="scoreboard">
{{msg}}
<br/>
<br/>
<ol>
{{#scores}}
    <li>{{name}} - {{score}}</li>
{{/scores}}
{{^scores}}
Waiting for scores...
{{/scores}}
</ol>
</div>
