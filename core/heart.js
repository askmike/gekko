// The heart does two things:
//  - emit a start event used for the candleManager 
//  to prepare (load history, and find out if we can
//  use it or not).
//  - (on ready) emit tick events and that the loop.

var util = require('./util');
var config = util.getConfig();
var log = require(util.dirs().core + 'log');

var _ = require('lodash');
var moment = require('moment');

var Heart = function() {
  _.bindAll(this);
}

var Util = require('util');
var EventEmitter = require('events').EventEmitter;
Util.inherits(Heart, EventEmitter);

Heart.prototype.start = function() {
  // TODO: STREAMS!
  if(!config.watch.enabled)
    throw 'Watching a live market is the only supported mode right now.';

  this.emit('start');
}

Heart.prototype.onReady = function() {
  log.debug('scheduling ticks');
  this.scheduleTicks();
}

Heart.prototype.tick = function() {
  this.emit('tick');
}

Heart.prototype.determineLiveTickRate = function() {
  // TODO: make dynamic based on either exchange or market activity.
  var seconds = 20;
  this.tickRate = +moment.duration(seconds, 's');
}

Heart.prototype.scheduleTicks = function() {
  this.determineLiveTickRate();
  setInterval(this.tick, this.tickRate);

  // start!
  _.defer(this.tick);
}

module.exports = Heart;