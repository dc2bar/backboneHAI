var _ = require('underscore')._,
    Backbone = require('backbone'),
    pubnub = require('pubnub').init({
      publish_key: 'pub-c-94687441-ef61-4ff5-a0eb-c852642a769a',
      subscribe_key: 'sub-c-e3c8bbee-926d-11e3-9979-02ee2ddab7fe',
      ssl: true
    });

var UserModel = Backbone.Model.extend({});
var UsersCollection = Backbone.Collection.extend({
  model: UserModel
});

var MessageModel = Backbone.Model.extend({});
var MessagesCollection = Backbone.Collection.extend({
  model: MessageModel
});

var usersCollection = new UsersCollection();
var messagesCollection = new MessagesCollection();

var filters = [];

var messageCounter = 1;

pubnub.subscribe({
  channel: 'backbone-collection-MessagesCollection',
  callback: function (data) {
    if (data.method === 'create') {
      messagesCollection.add(data.model);
      if(messagesCollection.length > 50){
        messagesCollection.remove(messagesCollection.first(messagesCollection.length - 50));
      }
    } else if (data.method === 'update') {
      messagesCollection.remove(data.model);
    } else if (data.method === 'delete') {
      var record = _.find(messagesCollection.models, function (record) {
        return record.id === data.model.id;
      });

      if (record == null) {
        console.log("Could not record: " + model.id);
      }

      var diff = _.difference(_.keys(record.attributes), _.keys(data.model));
      _.each(diff, function(key) {
        return record.unset(key);
      });

      return record.set(data.model, data.options);
    }
  }
});

pubnub.subscribe({
  channel : 'fuck_pubnub',
  message : function(m){
    switch(m.type){
      case 'update':
        var userobject = m.data.userobject;
        var target = usersCollection.where({ name: userobject.name });
        target[0].set(userobject);
        break;
      case 'logoff':
        var target = usersCollection.where({ name: m.data.username });
        for(var i in target){
          target[i].destroy();
        }
        break;
    }
  }
});

var express = require('express');

var app = module.exports = express.createServer();

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.get('/getUsers', function(req, res){
  res.header('Content-Type', 'application/json');
  res.header('Charset', 'utf-8');
  res.send(req.query.callback + '('+JSON.stringify(usersCollection)+');');
});

app.get('/getMessages', function(req, res){
  res.header('Content-Type', 'application/json');
  res.header('Charset', 'utf-8');
  res.send(req.query.callback + '('+JSON.stringify(messagesCollection)+');');
});

app.get('/safePreview', function(req, res){
  var target = req.query.uri;
  target = new Buffer(target, 'base64').toString('utf8');
  var request = require('request').defaults({ encoding: null });

  request.get(target, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var data = "data:" + response.headers["content-type"] + ";base64," + new Buffer(body).toString('base64');
      console.log(data);
      res.send(req.query.callback + '({"image":"'+data+'"});');
    } else {
      res.send(req.query.callback + '({"error":"'+error+'"});');
    }
  });
});

app.get('/addFilter', function(req, res){
  res.header('Content-Type', 'application/json');
  res.header('Charset', 'utf-8');
  var user = req.query.user;
  var from = req.query.from;
  var to = req.query.to;
  var filter = {from: from, to: to};
  filters[user] = filter;
  res.send(req.query.callback + '('+JSON.stringify(filter)+');');
});

var checkedIn = [];

app.get('/stillHere', function(req, res){
  res.header('Content-Type', 'application/json');
  res.header('Charset', 'utf-8');
  var model = new UserModel({
    name: req.query.name,
    color: req.query.color,
    avatar: req.query.avatar,
    title: req.query.title
  })
  checkedIn[''+req.query.name] = model;
  res.send(req.query.callback + '('+JSON.stringify(usersCollection)+');');
});

function clearUsers() {
  usersCollection.reset();
  var keys = [];
  for(var i in checkedIn) {
    keys.push(i);
  }
  keys.sort();
  for(var i in keys) {
    usersCollection.add(checkedIn[keys[i]]);
  }
  checkedIn = [];
}

setInterval(clearUsers, 2000);


app.listen(80);







