// The heart schedules and emit ticks every 20 seconds.

var util = require(__dirname + '/../util');
var log = require(util.dirs().core + 'log');

var _ = require('lodash');
var moment = require('moment');

var Heart = function() {
  _.bindAll(this);
}

util.makeEventEmitter(Heart);

Heart.prototype.pump = function() {
  log.debug('scheduling ticks');
  this.scheduleTicks();
}

Heart.prototype.tick = function() {
  this.emit('tick');
}

Heart.prototype.determineLiveTickRate = function() {
  // TODO: fix
  if(util.getConfig().watch.exchange === 'okcoin')
    var seconds = 2;
  else
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
