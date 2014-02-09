/*
  
  PPO - cykedev 15/01/2014

 */
// helpers
var _ = require('lodash');
var Util = require('util');
var log = require('../core/log.js');

var config = require('../core/util.js').getConfig();
var settings = config.PPO;

var PPO = require('./indicators/PPO.js');

var TradingMethod = function() {
  _.bindAll(this);

  this.trend = {
    direction: 'none',
    duration: 0,
    persisted: false,
    adviced: false
  };

  this.historySize = config.tradingAdvisor.historySize;
  this.ppo = new PPO(settings);
}

var Util = require('util');
var EventEmitter = require('events').EventEmitter;
Util.inherits(TradingMethod, EventEmitter);

TradingMethod.prototype.update = function(candle) {
  var price = candle.c;

  this.lastPrice = price;
  this.ppo.update(price);

  if(this.ppo.short.age < this.historySize)
    return;

  this.log();
  this.calculateAdvice();
}

// for debugging purposes log the last 
// calculated parameters.
TradingMethod.prototype.log = function() {
  var digits = 8;
  var short = this.ppo.short.result;
  var long = this.ppo.long.result;
  var macd = this.ppo.macd;
  var ppo = this.ppo.ppo;
  var macdSignal = this.ppo.MACDsignal.result;
  var ppoSignal = this.ppo.PPOsignal.result;

  log.debug('calculated MACD properties for candle:');
  log.debug('\t', 'short:', short.toFixed(digits));
  log.debug('\t', 'long:', long.toFixed(digits));
  log.debug('\t', 'macd:', macd.toFixed(digits));
  log.debug('\t', 'macdsignal:', macdSignal.toFixed(digits));
  log.debug('\t', 'machist:', (macd - macdSignal).toFixed(digits));
  log.debug('\t', 'ppo:', ppo.toFixed(digits));
  log.debug('\t', 'pposignal:', ppoSignal.toFixed(digits));
  log.debug('\t', 'ppohist:', (ppo - ppoSignal).toFixed(digits));  
}

TradingMethod.prototype.calculateAdvice = function() {
  var price = this.lastPrice;
  var long = this.ppo.long.result;
  var short = this.ppo.short.result;
  var macd = this.ppo.macd;
  var ppo = this.ppo.ppo;
  var macdSignal = this.ppo.MACDsignal.result;
  var ppoSignal = this.ppo.PPOsignal.result;

  // TODO: is this part of the indicator or not?
  // if it is it should move there
  var macdHist = macd - macdSignal;
  var ppoHist = ppo - ppoSignal;

  if(ppoHist > settings.thresholds.up) {

    // new trend detected
    if(this.trend.direction !== 'up')
      this.trend = {
        duration: 0,
        persisted: false,
        direction: 'up',
        adviced: false
      };

    this.trend.duration++;

    log.debug('In uptrend since', this.trend.duration, 'candle(s)');

    if(this.trend.duration >= settings.thresholds.persistence)
      this.trend.persisted = true;

    if(this.trend.persisted && !this.trend.adviced) {
      this.trend.adviced = true;
      this.advice('long');
    } else
      this.advice();
    
  } else if(ppoHist < settings.thresholds.down) {

    // new trend detected
    if(this.trend.direction !== 'down')
      this.trend = {
        duration: 0,
        persisted: false,
        direction: 'down',
        adviced: false
      };

    this.trend.duration++;

    log.debug('In downtrend since', this.trend.duration, 'candle(s)');

    if(this.trend.duration >= settings.thresholds.persistence)
      this.trend.persisted = true;

    if(this.trend.persisted && !this.trend.adviced) {
      this.trend.adviced = true;
      this.advice('short');
    } else
      this.advice();


  } else {

    log.debug('In no trend');

    // we're not in an up nor in a downtrend
    // but for now we ignore sideways trends
    // 
    // read more @link:
    // 
    // https://github.com/askmike/gekko/issues/171

    // this.trend = {
    //   direction: 'none',
    //   duration: 0,
    //   persisted: false,
    //   adviced: false
    // };

    this.advice();
  }

}

TradingMethod.prototype.advice = function(newPosition) {
  if(!newPosition)
    return this.emit('soft advice');

  this.emit('advice', {
    recommandation: newPosition,
    portfolio: 1
  });
}

module.exports = TradingMethod;
