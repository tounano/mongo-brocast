'use strict';

var EventEmitter = require('events').EventEmitter,
  Stream = require('stream').PassThrough;

module.exports = PublishStreamCreator;

function PublishStreamCreator(channel) {
  var emitter = new EventEmitter();
  var publishStream;

  channel.on('published', function (event) {
    if (!publishStream) {
      publishStream = new Stream({objectMode: true});

      process.nextTick(function () {
        emitter.emit('publishStream', publishStream);
      })
    }

    publishStream.push(event);
  })

  channel.on('close', function () {
    publishStream.end();
  })

  return emitter;
}