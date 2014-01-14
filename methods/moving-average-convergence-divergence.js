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

var EMA = require('./indicators/exponantial-moving-average.js');

var TradingMethod = function () {
  _.bindAll(this);

  this.currentTrend = 'none';
  this.trendDuration = 0;

  this.historySize = config.tradingAdvisor.historySize;

  this.diff;
  this.ema = {
    short: new EMA(settings.short),
    long: new EMA(settings.long),
    signal: new EMA(settings.signal)
  };
}

var Util = require('util');
var EventEmitter = require('events').EventEmitter;
Util.inherits(TradingMethod, EventEmitter);

TradingMethod.prototype.update = function (candle) {
  this.lastCandle = candle;
  this.calculateEMAs(candle);

  if(this.ema.short.age < this.historySize)
    return;

  this.log();
  this.calculateAdvice();
}


// add a price and calculate the EMAs and
// the diff for that price
TradingMethod.prototype.calculateEMAs = function (candle) {
  // the two EMAs
  _.each(['short', 'long'], function (type) {
    this.ema[type].update(candle.c);
  }, this);
  // the MACD
  this.calculateEMAdiff();
  // the signal
  this.ema['signal'].update(this.diff);
}

// for debugging purposes log the last 
// calculated parameters.
TradingMethod.prototype.log = function () {
  var digits = 8;
  var macd = this.diff;
  var signal = this.ema.signal.result;

  log.debug('calced MACD properties for candle:');
  log.debug('\t', 'short:', this.ema.short.result.toFixed(digits));
  log.debug('\t', 'long:', this.ema.long.result.toFixed(digits));
  log.debug('\t', 'macd:', macd.toFixed(digits));
  log.debug('\t', 'signal:', signal.toFixed(digits));
  log.debug('\t', 'macdiff:', (macd - signal).toFixed(digits));  
}

// @link https://github.com/virtimus/GoxTradingBot/blob/85a67d27b856949cf27440ae77a56d4a83e0bfbe/background.js#L145
TradingMethod.prototype.calculateEMAdiff = function () {
  var shortEMA = this.ema.short.result;
  var longEMA = this.ema.long.result;

  this.diff = shortEMA - longEMA;
}

TradingMethod.prototype.calculateAdvice = function () {
  var macd = this.diff;
  var price = this.lastCandle.c;
  var long = this.ema.long.result;
  var short = this.ema.short.result;
  var signal = this.ema.signal.result;
  var macddiff = macd - signal;

  var message = [
    '@ P:',
    price.toFixed(3),
    ' (L:',
    long.toFixed(3),
    ', S:',
    short.toFixed(3),
    ', M:',
    macd.toFixed(3),
    ', s:',
    signal.toFixed(3),
    ', D:',
    macddiff.toFixed(3),
    ')'
    ].join('');

  if(macddiff > settings.buyThreshold) {

    if(this.currentTrend === 'down')
      this.trendDuration = 0;

    this.trendDuration += 1;

    if(this.trendDuration < settings.persistence )
      this.currentTrend = 'PendingUp';

    if(this.currentTrend !== 'up' && this.trendDuration >= settings.persistence) {
        this.currentTrend = 'up';
        this.advice('long');
        message = 'MACD advice - BUY' + message;
    }
    else
      this.advice();
    
  } else if(macddiff < settings.sellThreshold) {

    if(this.currentTrend === 'up') this.trendDuration = 0;

    this.trendDuration += 1;
    if(this.trendDuration < settings.persistence )
       this.currentTrend = 'PendingDown';

    if(this.currentTrend !== 'down' && this.trendDuration >= settings.persistence) {
        this.currentTrend = 'down';
        this.advice('short');
        message = 'MACD Advice - SELL' + message;
    }
    else
      this.advice();

  } else {
    this.currentTrend = 'none';
    this.advice();
    // Trend has ended so reset counter
    this.trendDuration = 0;
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
