<?xml version="1.0" encoding="UTF-8"?>
<vxml version="2.0">

<form id="sorry">
<var name="nocache" expr="{{nocache}}"/>
<block>
    Hello, {{name}}.
    <audio src="http://uw.makehistory.com/audio/welcome.gsm">
Welcome to the Marchex University of Washington Career Fair quiz!
Each question will have be multiple choice or have numeric answers, and the questions will get progressively more difficult.
Answer each question by using the keypad on your phone, followed by the pound sign.
At any time you may hang up to research or work out the solution.  When you call back, it will resume where you left off.
You must always use the phone you registered with to maintain your progress.
Check the leaderboard at u w dot make history dot com.
    </audio>
    <goto next="#question"/>
</block>
</form>
{{>vxml/question_form}}
</vxml>
