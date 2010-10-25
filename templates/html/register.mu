<html>
<head><title>Signup form</title></head>
<body>
  {{#errors}}
  <div class="error">
    {{message}}
  </div>
  {{/errors}}
  {{#success}}
  <div class="success">
    <b>{{message}}</b>
  </div>
  {{/success}}
  <form method="post" action="/register">
    <table>
      <tr><th><label for="caller_name"  >Name:  </label></th><td><input type="text" id="caller_name"   name="caller_name"  ></td></tr>
      <tr><th><label for="caller_number">Phone Number:</label></th><td><input type="text" id="caller_number" name="caller_number"></td></tr>
      <tr><th><label for="caller_email" >Email: </label></th><td><input type="text" id="caller_email"  name="caller_email" ></td></tr>
      <tr><td>&nbsp;</td><td><input type="submit" id="Submit" name="Submit"></td></tr>
    </table>
  </form>
    Notes: YES, this will be styled and beautified prior to the contest.
    <br/>
    The phone number you enter is used to track your progress, and must match the number you call from.
    <br/>
    The call-in number for the quiz is: (800) 724-4683
</body>
