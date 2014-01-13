var util = require('../core/util');
var log = require('../core/log');
var _ = require('lodash');

var config = util.getConfig();


var methods = {
  'MACD': 'moving-average-convergence-divergence',
  'EMA': 'exponential-moving-average-crossovers'
}

var Actor = function() {
  _.bindAll(this);

  var method = config.tradingAdvisor.method;
  var fullMethod = methods[method];

  if(!fullMethod)
    util.die('Gekko doesn\'t know the method' + method);

  log.info('\t', 'Using the trading method:' + method);

  var Consultant = require('../methods/' + fullMethod);

  this.method = new Consultant;
}

Actor.prototype.processCandle = function(candle) {
  this.method.update(candle);
}

module.exports = Actor;