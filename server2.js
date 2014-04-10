/* SERVER SETUP */
var express = require('express');

var app = express();
var fs = require('fs')
    , https = require('https');

//ssl configs
var httpsOptions = {
  key: fs.readFileSync('certs/privatekey.pem')
  , cert: fs.readFileSync('certs/certificate.pem')
}

//configure express
app.configure(function(){
  //include JADE templating engine
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  //define public path
  app.use(express.static(__dirname + '/public'));
});
/* END SERVER SETUP */

/* ROUTES */
var messages = require('./routes/messages'),
    users = require('./routes/users'),
    sp = require('./routes/sp');

//messages
app.get('/messages', messages.getMessages);
app.post('/messages', messages.addMessage);

//users
app.get('/users', users.getUsers);
app.post('/users', users.addUser);

//safe preview
app.get('/sp', sp.init_p);

//pic get

/* END ROUTES */

/* INIT - BOOT THIS BITCH UP */
app.listen(3080);
var secureServer = https.createServer(httpsOptions, app).listen(443, function(){
  console.log("https server listening on port 443");
});
/* END INIT */