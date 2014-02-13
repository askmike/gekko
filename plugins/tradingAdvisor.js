var util = require('../core/util');
var log = require('../core/log');
var _ = require('lodash');

var config = util.getConfig();

var methods = [
  'MACD',
  'DEMA',
  'PPO'
];

var Actor = function() {
  _.bindAll(this);

  var methodName = config.tradingAdvisor.method;

  if(!_.contains(methods, methodName))
    util.die('Gekko doesn\'t know the method ' + methodName);

  log.info('\t', 'Using the trading method: ' + methodName);

  var Consultant = require('../core/baseTradingMethod');

  var method = require('../methods/' + methodName);

  // bind all trading method specific functions
  // to the Consultant.
  _.each(method, function(fn, name) {
    Consultant.prototype[name] = fn;
  });

  this.method = new Consultant;
}

Actor.prototype.processCandle = function(candle) {
  this.method.tick(candle);
}

module.exports = Actor;
