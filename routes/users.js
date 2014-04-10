function user(userData,timeNow)
{
  var username = userData.username;
  var avatar = userData.avatar;
  var message = userData.message;
  var color = userData.color;
  var title = userData.title;
  var lastCheckin = timeNow;
}

var allUsers = [];

exports.addUser = function(req, res) {
  var incomming = req.body;
  allUsers.push(new user(incomming,(new Date).getTime()));
}

exports.getUsers = function(req, res) {
  res.send({users:allUsers});
}

