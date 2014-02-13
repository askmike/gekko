var _ = require('lodash');
var util = require('../core/util.js');
var config = util.getConfig();
var log = require('../core/log.js');

var Base = function() {
  _.bindAll(this);
  // properties
  this.age = 0;

  // defaults
  this.requiredHistory = 0;

  // make sure we have all methods
  _.each(['init', 'update', 'check'], function(fn) {
    if(!this[fn])
      util.die('No ' + fn + ' function in this trading method found.')
  }, this);

  // let's run the implemented starting point
  this.init();

  // should be set up now, check some things
  // to make sure everything is implemented
  // correctly.
  if(!this.name)
    log.warn('Warning, trading method has no name');

  if(!config.debug || !this.log)
    this.log = function() {};
}

// teach our base trading method events
var Util = require('util');
var EventEmitter = require('events').EventEmitter;
Util.inherits(Base, EventEmitter);

Base.prototype.tick = function(candle) {
  this.age++;
  this.update(candle);

  if(this.requiredHistory < this.age)
    return;

  this.log();
  this.check();
}

Base.prototype.advice = function(newPosition) {
  if(!newPosition)
    return this.emit('soft advice');

  this.emit('advice', {
    recommandation: newPosition,
    portfolio: 1
  });
}

module.exports = Base;