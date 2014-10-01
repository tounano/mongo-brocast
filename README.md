# brocast

Pub/Sub with MongoDB. A `Brocast` implementation.

Reactive, and easily extensible.

This implementation is `EventStore` compatible, as you can subscribe to past events.

## Usage

### var pubsub = new MubSub(db, opts)

**Args:**

*  `db` - Instance of Db() from MongoDB's native driver.
*  `opts` - Object with Options.

**Options:**

*  `channelSize` - (default=16MB) Max amount of bytes for each channel.
 If a channel will exceed this size, new events will overwrite old ones.
*  `maxEventsPerChannel` - (default=1000) If your channel is less than `channelSize`, what's the max amount of events
 to store.
*  `ns` - (default='pubsub'). The prefix for the collection names that would be created by this module.
*  `separator` - (default=':'). The separator between `ns` and the pubsub related namespaces.
*  `collectionNameGenerator` - (Optional function). You can implement your own naming scheme.
*  `dao` - (Optional object). You can implement your own MongoDB Data Access Object.
 The default naming scheme is: '%ns%%separator%%CHANNEL_NAME%.
*  `writeStreamFactory` - (Optional function). Returns a Writeable Stream that stores events in MongoDB.
 You can implement your own storage scheme.
*  `readStreamFactory` - (Optional function). Returns a readable stream with events being published. You can implement
 your own retrieval strategy.

**Events:**

*  `error` - All errors would be redirected to the main instance of MubSub.

### var tstChannel = pubsub.channel(channelName);

Returns a Channel instance from `brocast`.

**Args:**

*  `channelName` - The name of the channel.

**Events:**

*  `newSubscriber` - When someone subscribes to this channel it emits the Subscriber object.

### tstChannel.publish(name, message)

Publishes a new message to the channel.

**Args:**

*  `name` - The name of the event to publish.
*  `message` - The message to publish. It can be String, Array or Json object.

### var subscriber = tstChannel.subscribe(eventName, opts);

Returns an instance of `brocast` subscriber object, which is a Readable stream.

**Args:**

*  `eventName` - The name of the event to subscribe to.
*  `opts` - Object with options.

**Options:**

*  `start` - The last eventId that you dispatched. If `undefined`, it'll subscribe only to new events. If the
 value is `0` it will subscribe to all events available in the channel.

**Events:**

* `unsubscribe` - This event is emitted if you call the `unsubscribe` method.
* `data` - The events that are being dispatched.

### Event struct

A dispatched event looks like this:

```js
{
  _id: 542bf84fa51ffd383cea96ff,
  name: 'test event',
  channel: 'tstChannel',
  timestamp: 1412167759481,
  msg: 386.00159669294953
}
```

### subscriber.unsubscribe();

Unsubscribe from receiving events.

## Example:

```js
var MongoClient = require("mongodb").MongoClient,
  MubSub = require('../lib/mubsub');

var dbConfig = {
    "uri": "mongodb://192.168.111.222:27017/mubsub",
    "options": {
    "server": {
      "socketOptions": {
        "keepAlive": 1
      }
    }
  }
}

MongoClient.connect(dbConfig.uri, dbConfig.options, function (err, db) {
  var client = new MubSub(db);
  var channel = client.channel('tstChannel');

  var sub = channel.subscribe('test event').on('data', function (event) {console.log('received', event)})

  channel.publish('test event', Math.random()*1000);
});
```

## Future Plans

*  Standardize the `Event Struct` and decouple it from Mongo. i.e. id instead of _id.
*  When subscribing, add another option `lastId` to act as an alias for `start`
*  Implement a retrial mechanism in case there is a DB failure. (Probabbly in a separate module)
*  Implement balanced event insertion. Right now, the events are inserted as they arrive, without back pressure concern.
*  Implement bulk event insertion using MongoDB's Bulk insertion feature.
*  Not directly related to this module, but it should be implemented for the browser as well.
*  Find a better name.

## install

With [npm](https://npmjs.org) do:

```
npm install brocast
```

## license

MIT