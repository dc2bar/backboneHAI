var mongo = require('mongodb');

var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;

var server = new Server('localhost', 27017, {auto_reconnect: true});
db = new Db('messages', server);

db.open(function(err, db) {
  if(!err) {
    console.log("Connected to 'messages' database");
    db.collection('messages', {strict:true}, function(err, collection) {
      if (err) {
        console.log("The 'messages' collection doesn't exist. Creating it with sample data...");
        populateDB();
      }
    });
  }
});

exports.findById = function(req, res) {
  var id = req.params.id;
  console.log('Retrieving message: ' + id);
  db.collection('messages', function(err, collection) {
    collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
      res.send(item);
    });
  });
};

exports.findAll = function(req, res) {
  db.collection('messages', function(err, collection) {
    collection.find().toArray(function(err, items) {
      res.send(items);
    });
  });
};

exports.addWine = function(req, res) {
  var wine = req.body;
  console.log('Adding message: ' + JSON.stringify(wine));
  db.collection('message', function(err, collection) {
    collection.insert(wine, {safe:true}, function(err, result) {
      if (err) {
        res.send({'error':'An error has occurred'});
      } else {
        console.log('Success: ' + JSON.stringify(result[0]));
        res.send(result[0]);
      }
    });
  });
}

/*--------------------------------------------------------------------------------------------------------------------*/
// Populate database with sample data -- Only used once: the first time the application is started.
// You'd typically not find this code in a real-life app, since the database would already exist.
var populateDB = function() {

  var messages = [
    {
      avatar: "http://img3.wikia.nocookie.net/__cb20121202220100/darkwingduck/images/4/46/Darkwing_Duck.jpg",
      sender: "S_K",
      color: "#ffffff",
      recipient: "all",
      message: "hello",
      time: "1"
    },
    {
      avatar: "http://img3.wikia.nocookie.net/__cb20121202220100/darkwingduck/images/4/46/Darkwing_Duck.jpg",
      sender: "S_K",
      color: "#ffffff",
      recipient: "all",
      message: "world",
      time: "1230123"
    }];

  db.collection('messages', function(err, collection) {
    collection.insert(messages, {safe:true}, function(err, result) {});
  });

};