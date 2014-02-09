/*
  
  MACD - DJM 31/12/2013

 */
// helpers
var moment = require('moment');
var _ = require('lodash');
var util = require('../core/util.js');
var Util = require('util');
var log = require('../core/log.js');

var config = util.getConfig();
var settings = config.MACD;

var MACD = require('./indicators/MACD.js');

var TradingMethod = function () {
  _.bindAll(this);

  this.trend = {
    direction: 'none',
    duration: 0,
    persisted: false,
    adviced: false
  };

  this.historySize = config.tradingAdvisor.historySize;
  this.macd = new MACD(settings);
}

var Util = require('util');
var EventEmitter = require('events').EventEmitter;
Util.inherits(TradingMethod, EventEmitter);

TradingMethod.prototype.update = function(candle) {
  var price = candle.c;

  this.lastPrice = price;
  this.macd.update(price);

  if(this.macd.short.age < this.historySize)
    return;

  this.log();
  this.calculateAdvice();
}

// for debugging purposes log the last 
// calculated parameters.
TradingMethod.prototype.log = function() {
  var digits = 8;
  var macd = this.macd.diff;
  var signal = this.macd.signal.result;
  var result = this.macd.result;

  log.debug('calculated MACD properties for candle:');
  log.debug('\t', 'short:', this.macd.short.result.toFixed(digits));
  log.debug('\t', 'long:', this.macd.long.result.toFixed(digits));
  log.debug('\t', 'macd:', macd.toFixed(digits));
  log.debug('\t', 'signal:', signal.toFixed(digits));
  log.debug('\t', 'macdiff:', result.toFixed(digits));  
}

TradingMethod.prototype.calculateAdvice = function() {
  var macd = this.diff;
  var price = this.lastPrice;
  var long = this.macd.long.result;
  var short = this.macd.short.result;
  var signal = this.macd.signal.result;
  var macddiff = this.macd.result;

  if(macddiff > settings.thresholds.up) {

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

  } else if(macddiff < settings.thresholds.down) {

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
