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
      <tr><th><label for="caller_name"  >Caller name:  </label></th><td><input type="text" id="caller_name"   name="caller_name"  ></td></tr>
      <tr><th><label for="caller_number">Caller number:</label></th><td><input type="text" id="caller_number" name="caller_number"></td></tr>
      <tr><th><label for="caller_email" >Caller email: </label></th><td><input type="text" id="caller_email"  name="caller_email" ></td></tr>
      <tr><td>&nbsp</td><td><input type="submit" id="Submit" name="Submit"></td></tr>
    </table>
  </form>
</body>
