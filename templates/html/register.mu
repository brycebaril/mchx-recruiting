{{>html/header}}
<h2><br />Make History Quiz - Registration</h2>
  {{#errors}}
  <div class="error">
    {{message}}
  </div>
  {{/errors}}
  {{#success}}
  <div class="success" class="sub_topic">
    <b>{{message}}</b>
  </div>
  {{/success}}
  <form method="post" action="/register">
    <table>
      <tr><th><label for="caller_name"  >Name:  </label></th><td><input type="text" id="caller_name"   name="caller_name"  ></td></tr>
      <tr><th><label for="caller_number">Phone Number*:</label></th><td><input type="text" id="caller_number" name="caller_number"></td></tr>
      <tr><th><label for="caller_email" >Email: </label></th><td><input type="text" id="caller_email"  name="caller_email" ></td></tr>
      <tr><td>&nbsp;</td><td><input type="submit" id="Submit" name="Submit"></td></tr>
    </table>
  </form>
  <div class="sub_topic">
    <br/>
    *The phone number you enter is used to track your progress, and must match the number you call from.
    <br/>
    <br/>
    <a href="http://uw.makehistory.com">View the LIVE Scoreboard</a>
    <br />
    The call-in number for the quiz is: <bold>(800) 724-4683</bold>
    <br/>
    <img src="img/quiz_tel.png"/>
    <br/>
    We will not share, publish or otherwise use your phone number or email for any purpose other than following up if you win a prize, or to talk about career opportunities at Marchex.
  </div>
{{>html/footer}}
