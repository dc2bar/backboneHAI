exports.init_p = function(req, res){
  var target = req.query.quoteID;
  target = new Buffer(target, 'base64').toString('utf8');
  var request = require('request').defaults({ encoding: null });

  request.get(target, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var data = "data:" + response.headers["content-type"] + ";base64," + new Buffer(body).toString('base64');
      res.send(req.query.callback + '({"ix":"'+ new Buffer(data).toString('base64') +'"});');
    } else {
      res.send(req.query.callback + '({"error":"'+error+'"});');
    }
  });
}