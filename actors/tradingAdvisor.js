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

  var method = config.tradingAdvisor.method;

  if(!_.contains(methods, method))
    util.die('Gekko doesn\'t know the method' + method);

  log.info('\t', 'Using the trading method:' + method);

  var Consultant = require('../methods/' + method);

  this.method = new Consultant;
}

Actor.prototype.processCandle = function(candle) {
  this.method.update(candle);
}

module.exports = Actor;
