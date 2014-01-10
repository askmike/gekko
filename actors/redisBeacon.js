var _ = require('underscore');

var util = require('../core/util');
var config = util.getConfig();
var redisBeacon = config.redisBeacon;
var watch = config.watch;

var subscriptions = require('../subscriptions');

var Actor = function(done) {
  _.bindAll(this);

  this.market = [
    watch.exchange,
    watch.currency,
    watch.asset
  ].join('/');

  this.init(done);
}

// This actor is dynamically build based on
// what the config specifies it should emit.
// 
// This way we limit overhead because Gekko
// only binds to events redis is going to
// emit.

var proto = {};
_.each(redisBeacon.broadcast, function(e) {
  // grab the corresponding subscription 
  var subscription = _.find(subscriptions, function(s) { return s.event === e });

  if(!subscription)
    util.die('Gekko does not know this event:' + e);

  proto[subscription.handler] = function(message) {
    this.emit(subscription.event, {
      market: this.market,
      data: message
    });
  };

}, this)

Actor.prototype = proto;

Actor.prototype.init = function(done) {
  // TODO: setup real redis client
  _.defer(done);
}

Actor.prototype.emit = function(channel, message) {
  console.log('REDIS EMIT CHANNEL', channel);
  console.log('REDIS EMIT DATA', message);
}

module.exports = Actor;