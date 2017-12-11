/*

  PPO - cykedev 15/01/2014

  (updated a couple of times since, check git history)

 */

// helpers
var _ = require('lodash');
var log = require('../core/log');

// let's create our own method
var method = {};

// prepare everything our method needs
method.init = function() {
  this.name = 'PPO';

  this.trend = {
   direction: 'none',
   duration: 0,
   persisted: false,
   adviced: false
  };

  this.requiredHistory = this.tradingAdvisor.historySize;

  // define the indicators we need
  this.addIndicator('ppo', 'PPO', this.settings);
}

// what happens on every new candle?
method.update = function(candle) {
  // nothing!
}

// for debugging purposes log the last
// calculated parameters.
method.log = function() {
  var digits = 8;
  var ppo = this.indicators.ppo;
  var long = ppo.result.longEMA;
  var short = ppo.result.shortEMA;
  var macd = ppo.result.macd;
  var result = ppo.result.ppo;
  var macdSignal = ppo.result.MACDsignal;
  var ppoSignal = ppo.result.PPOsignal;

  log.debug('calculated MACD properties for candle:');
  log.debug('\t', 'short:', short.toFixed(digits));
  log.debug('\t', 'long:', long.toFixed(digits));
  log.debug('\t', 'macd:', macd.toFixed(digits));
  log.debug('\t', 'macdsignal:', macdSignal.toFixed(digits));
  log.debug('\t', 'machist:', (macd - macdSignal).toFixed(digits));
  log.debug('\t', 'ppo:', result.toFixed(digits));
  log.debug('\t', 'pposignal:', ppoSignal.toFixed(digits));
  log.debug('\t', 'ppohist:', (result - ppoSignal).toFixed(digits));
}

method.check = function(candle) {
  var price = candle.close;

  var ppo = this.indicators.ppo;
  var long = ppo.result.longEMA;
  var short = ppo.result.shortEMA;
  var macd = ppo.result.macd;
  var result = ppo.result.ppo;
  var macdSignal = ppo.result.MACDsignal;
  var ppoSignal = ppo.result.PPOsignal;

  // TODO: is this part of the indicator or not?
  // if it is it should move there
  var ppoHist = result - ppoSignal;

  if(ppoHist > this.settings.thresholds.up) {

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

    if(this.trend.duration >= this.settings.thresholds.persistence)
      this.trend.persisted = true;

    if(this.trend.persisted && !this.trend.adviced) {
      this.trend.adviced = true;
      this.advice('long');
    } else
      this.advice();

  } else if(ppoHist < this.settings.thresholds.down) {

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

    if(this.trend.duration >= this.settings.thresholds.persistence)
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
