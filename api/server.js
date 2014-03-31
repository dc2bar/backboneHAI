var express = require('express'),
    message = require('./routes/messages');

var app = express();

app.configure(function () {
  app.use(express.logger('dev'));     /* 'default', 'short', 'tiny', 'dev' */
  app.use(express.bodyParser());
});

app.get('/messages', message.findAll);
app.get('/messages/:id', message.findById);
app.post('/messages', message.addMessage);
/* these should never be used in our application
  app.put('/messages/:id', wine.updateMessage);
  app.delete('/messages/:id', wine.deleteMessage);
*/

app.listen(3000);
console.log('Listening on port 3000...');