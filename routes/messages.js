function message(messageData, messageID)
{
  var username = messageData.username;
  var avatar = messageData.avatar;
  var timestamp = (new Date).getTime();
  var message = messageData.message;
  var color = messageData.color;
  var id = messageID;
}

var messageCounter = 1;
var allMessages = [];

exports.addMessage = function(req, res) {
  var incomming = req.body;
  allMessages.push(new message(incomming,messageCounter));
  if(allMessages.length > 5){
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
  if(missedMessages.length > 0){
    res.send({messages:missedMessages});
  } else {
    res.send({messages:'current'});
  }
}

exports.getCurrent = function(){
  return messageCounter;
}
