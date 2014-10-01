'use strict';

var inherits = require('util').inherits,
  EventEmitter = require('events').EventEmitter,
  format = require('util').format;

module.exports = MongoDao;

function MongoDao (db, opts) {
  EventEmitter.call(this);
  this.db = db;
  this.generateCollectionName = opts.collectionNameGenerator || CollectionNameGenerator(opts);
  this.channelSize = opts.channelSize || (1024 * 1024 * 16);
  this.maxEventsPerCollection = opts.maxEventsPerCollection || 1000;
}
inherits(MongoDao, EventEmitter);

MongoDao.prototype.getCollectionForChannel = function (channel, done) {
  var self = this;
  self.db.createCollection(self.generateCollectionName(channel),
    {capped: true, size: self.channelSize, max: self.maxEventsPerCollection }, function (err, col) {
      if (err) return self.emit('error', err);
      done(col);
    });
}

function CollectionNameGenerator(opts) {
  var ns = opts.ns || 'pubsub',
    sep = opts.separator || ':';

  return function (channel) {
    return format('%s%s%s', ns, sep, channel.name);
  }
}