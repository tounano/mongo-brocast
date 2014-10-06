var PubSub = require('brocast').Brocast,
  format = require('util').format,
  PublishStreamCreator = require('./publish-stream'),
  Stream = require('stream').PassThrough,
  MongoDao = require('./mongo-dao'),
  ObjectId = require('mongodb').ObjectID;

module.exports = MongoBrocast;

function MongoBrocast(db, opts) {
  opts = opts || {};
  this.db = db;
  this.brocast = opts.brocast || new PubSub();

  var dao = opts.mongoDao || new MongoDao(db, opts),
    writeStreamFactory = opts.writeStreamFactory || WriteStreamFactory(dao, opts),
    readStreamFactory = opts.readStreamFactory || ReadStreamFactory(dao, opts);

  this.brocast.on('newChannel', function (channel) {

    PublishStreamCreator(channel).on('publishStream', function (pubStream) {
      pubStream.pipe(writeStreamFactory(channel));
    });

    channel.on('newSubscriber', function (subscriber) {
      readStreamFactory(subscriber, channel).pipe(subscriber);
    });
  })
}

MongoBrocast.prototype.channel = function (channelName, opts) {
  return this.brocast.channel(channelName, opts);
}

function WriteStreamFactory(dao, opts) {
  return function (channel) {
    var ws = new Stream({objectMode: true});

    dao.getCollectionForChannel(channel, function (col) {
      ws.on('data', function (event) {
        col.insert(event, function (err, result) {
          if (err) return dao.emit('error', err);
          dao.emit('storedEvent', event);
        });
      });
    });

    return ws;
  }
}

function ReadStreamFactory(dao, opts) {
  return function (subscriber, channel) {
    var rs = new Stream({objectMode: true});

    dao.getCollectionForChannel(channel, function (col) {
      getLastId(subscriber.opts.start, col, function (err, id) {
        if (err) return rs.emit('error', err);

        var selector = {name: subscriber.eventName};
        if (id) selector._id = {$gt: new ObjectId(id)};

        var cursor = col.find(selector,
          {tailable: true, awaitfordata: true, numberOfRetries: -1});

        subscriber.on('unsubscribe', function () {
          rs.end();
          setTimeout(function () {cursor.close();}, 1000);
        });

        var stream = cursor.stream();
        stream.on('error', function (err) {rs.emit('error', err)});
        stream.pipe(rs);
      })
    })

    return rs;
  }

  function getLastId(initial, col, done) {
    if (initial) return done(null, initial);
    if (initial == 0) return done(null, undefined);

    col.findOne({}, {_id: 1}, {sort:{$natural: -1}}, function (err, result) {
      done(err, result && result._id);
    })
  }
}