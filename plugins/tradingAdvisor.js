var util = require('../core/util');
var _ = require('lodash');

var config = util.getConfig();
var dirs = util.dirs();
var log = require(dirs.core + '/log');
var CandleBatcher = require(dirs.core + 'candleBatcher');

var methods = [
  'MACD',
  'DEMA',
  'PPO',
  'RSI',
  'custom'
];

var Actor = function() {
  this.batcher = new CandleBatcher(config.tradingAdvisor.candleSize);

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
  this.batcher
    .on('candle', this.processCustomCandle)

  this.method
    .on('advice', this.relayAdvice);
}

util.makeEventEmitter(Actor);

// HANDLERS
// process the 1m candles
Actor.prototype.processCandle = function(candle) {
  this.batcher.write([candle]);
}

// propogate a custom sized candle to the trading method
Actor.prototype.processCustomCandle = function(candle) {
  this.method.tick(candle);
}

// EMITTERS
Actor.prototype.relayAdvice = function(advice) {
  this.emit('advice', advice);
}


module.exports = Actor;
