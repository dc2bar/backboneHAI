var Backbone = require('backbone');

var cMessageModel = Backbone.Model.extend({});
var cMessagesCollection = Backbone.Collection.extend({
  model: cMessageModel
});

var cmessagesCollection = new cMessagesCollection();
var messageCounter = 0;

exports.findAll = function(req, res) {
  db.collection('messages', function(err, collection) {
    collection.find().toArray(function(err, items) {
      res.send(items);
    });
  });
};

exports.addMessage = function(req, res) {
  var message = req.body;
  cmessagesCollection.add(message);
  if(cmessagesCollection.length > 50){
    cmessagesCollection.remove(cmessagesCollection.first(cmessagesCollection.length - 50));
  }
  messageCounter++;
  res.send({msgID: messageCounter});
}

exports.catchUp = function(req, res) {
  console.log(req.params);
  console.log(messageCounter);
  var last = req.params.lastID;
  if(last*1 == messageCounter){
    res.send([]);
  }
  var models = cmessagesCollection.select(function (model) {
    return model.get('msgID') > last;
  });
  console.log(models);
  res.send(models);
}

exports.getCurrent = function(){
  return messageCounter;
}
