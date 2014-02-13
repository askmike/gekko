/*
  
  PPO - cykedev 15/01/2014

  (updated a couple of times since, check git history)

 */
// helpers
var _ = require('lodash');
var log = require('../core/log.js');

// configuration
var config = require('../core/util.js').getConfig();
var settings = config.MACD;

// indicators
var MACD = require('./indicators/MACD.js');

// let's create our own method
var method = {};
method.init = function() {
 this.trend = {
   direction: 'none',
   duration: 0,
   persisted: false,
   adviced: false
 };

  this.historySize = config.tradingAdvisor.historySize;
  this.ppo = new PPO(settings);
}

method.update = function(candle) {
  var price = candle.c;
  this.lastPrice = price;
  this.ppo.update(price);
}

// for debugging purposes log the last 
// calculated parameters.
method.log = function() {
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

method.check = function() {
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

module.exports = method;
