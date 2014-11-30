var util = require('../core/util');
var dirs = util.dirs();
var log = require('../core/log');
var _ = require('lodash');

var config = util.getConfig();

var methods = [
  'MACD',
  'DEMA',
  'PPO',
  'RSI',
  'custom'
];

// TODO: emit event

var Actor = function() {
  _.bindAll(this);

  var methodName = config.tradingAdvisor.method;

  if(!_.contains(methods, methodName))
    util.die('Gekko doesn\'t know the method ' + methodName);

  log.info('\t', 'Using the trading method: ' + methodName);

  var Consultant = require(dirs.core + 'baseTradingMethod');

  var method = require(dirs.methods + methodName);

  // bind all trading method specific functions
  // to the Consultant.
  _.each(method, function(fn, name) {
    Consultant.prototype[name] = fn;
  });

  this.method = new Consultant;

  this.method
    .on('advice', this.relayAdvice);
}

util.makeEventEmitter(Actor);

// HANDLERS
Actor.prototype.processCandle = function(candle) {
  this.method.tick(candle);
}

// EMITTERS
Actor.prototype.relayAdvice = function(advice) {
  this.emit('advice', advice);
}


module.exports = Actor;
