var Backbone = require('backbone');

var cMessageModel = Backbone.Model.extend({});
var cMessagesCollection = Backbone.Collection.extend({
  model: cMessageModel
});

var cmessagesCollection = new cMessagesCollection();
var messageCounter = 1;

exports.findAll = function(req, res) {
  db.collection('messages', function(err, collection) {
    collection.find().toArray(function(err, items) {
      res.send(items);
    });
  });
};

exports.addMessage = function(req, res) {
  var message = req.body;
  message.msgID = messageCounter;
  cmessagesCollection.add(message);
  if(cmessagesCollection.length > 50){
    cmessagesCollection.remove(cmessagesCollection.first(cmessagesCollection.length - 50));
  }
  res.send({msgID: messageCounter});
  messageCounter++;
}

exports.catchUp = function(req, res) {
  var last = req.query.lastID;
  if(last*1 == messageCounter){
    res.send({status:"up-to-date"});
  }
  var models = cmessagesCollection.select(function (model) {
    return model.get('msgID') > last;
  });
  res.send(models);
}

exports.getCurrent = function(){
  return messageCounter;
}
