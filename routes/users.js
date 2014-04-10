function user(userData,timeNow)
{
  this.username = userData.username;
  this.avatar = userData.avatar;
  this.color = userData.color;
  this.title = userData.title;
  this.lastCheckin = timeNow;
}

var allUsers = [];

exports.addUser = function(req, res) {
  var incomming = req.body;
  allUsers.push(new user(incomming,(new Date).getTime()));
  res.send({status:'OK'})
}

exports.getUsers = function(req, res) {
  res.send({users:allUsers});
}

