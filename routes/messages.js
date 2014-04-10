function message(messageData, messageID)
{
  this.username = messageData.username;
  this.avatar = messageData.avatar;
  this.timestamp = (new Date).getTime();
  this.message = messageData.message;
  this.color = messageData.color;
  this.messageID = messageID;
}

var messageCounter = 1;
var allMessages = [];

exports.addMessage = function(req, res) {
  var incomming = req.body;
  allMessages.push(new message(incomming,messageCounter));
  if(allMessages.length > 50){
    allMessages = allMessages.slice(allMessages.length - 50, allMessages.length);
  }
  res.send({msgID: messageCounter});
  messageCounter++;
}

exports.getMessages = function(req, res) {
  var last = req.query.lastID ? req.query.lastID : 0;
  if(last*1 == messageCounter){
    res.send({status:"up-to-date"});
  }
  var missedMessages = [];
  for(var i in allMessages){
    var message = allMessages[i];
    if(message.messageID > last){
      missedMessages.push(message);
    }
  };
  res.send({messages:missedMessages});
}
