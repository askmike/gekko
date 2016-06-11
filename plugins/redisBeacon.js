var log = require('../core/log.js');
var util = require('../core/util');
var config = util.getConfig();
var redisBeacon = config.redisBeacon;
var watch = config.watch;

var subscriptions = require('../subscriptions');
var _ = require('lodash');

var redis = require("redis");

var Actor = function(done) {
  _.bindAll(this);

  this.market = [
    watch.exchange,
    watch.currency,
    watch.asset
  ].join('-');

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

  var channel = redisBeacon.channelPrefix + subscription.event

  proto[subscription.handler] = function(message, cb) {
    if(!_.isFunction(cb))
      cb = _.noop;

    this.emit(channel, {
      market: this.market,
      data: message
    }, cb);
  };

}, this)

Actor.prototype = proto;

Actor.prototype.init = function(done) {
  this.client = redis.createClient(redisBeacon.port, redisBeacon.host);
  this.client.on('ready', _.once(done));
}

Actor.prototype.emit = function(channel, message) {
  log.debug('Going to publish to redis channel:', channel);

  var data = JSON.stringify(message);
  this.client.publish(channel, data);
}

module.exports = Actor;