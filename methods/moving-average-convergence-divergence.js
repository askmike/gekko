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

  this.currentTrend;

  this.currentTrend;
  this.trendDuration = 1; // Needs to be 1 so trend fires on first candle if persistence=1

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

TradingMethod.prototype.init = function(history) {
  _.each(history.candles, function (candle) {
    this.calculateEMAs(candle);
  }, this);

  this.lastCandle = _.last(history.candles);
  this.log();
  this.calculateAdvice();
}

TradingMethod.prototype.update = function (candle) {
  this.lastCandle = candle;
  this.calculateEMAs(candle);
  this.log();
  this.calculateAdvice();
}


// add a price and calculate the EMAs and
// the diff for that price
TradingMethod.prototype.calculateEMAs = function (candle) {
  _.each(['short', 'long'], function (type) {
    this.ema[type].update(candle.p);
  }, this);
  this.calculateEMAdiff();

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


TradingMethod.prototype.calculateEMAdiff = function () {
  var shortEMA = this.ema.short.result;
  var longEMA = this.ema.long.result;

  this.diff = 100 * (shortEMA - longEMA) / ((shortEMA + longEMA) / 2);
}

TradingMethod.prototype.calculateAdvice = function () {
  var digits = 8;

  var macd = this.diff.toFixed(digits),
    price = this.lastCandle.c.toFixed(digits),
    signal = this.ema.signal.result.toFixed(digits),
    long = this.ema.long.result.toFixed(digits),
    short = this.ema.short.result.toFixed(digits),
    macddiff = macd - signal;

  if(settings.debug) log.info('Calculated MACD/diff: ' + macd + '/' + macddiff);

  macddiff = macddiff.toFixed(3);

  if(typeof price === 'string')
    price = parseFloat(price);

  if(config.normal.exchange !== 'cexio')
    price = price.toFixed(3);

  var message = '@ P:' + price + ' (L:' + long + ', S:' + short + ', M:' + macd + ', s:' + signal + ', D:' + macddiff + ')';

  if(config.backtest.enabled)
    message += '\tat \t' + moment.unix(this.currentTimestamp).format('YYYY-MM-DD HH:mm:ss');

  if(macddiff > settings.buyTreshold) {
    if(settings.debug) log.info('we are currently in an uptrend duration ' + this.trendDuration + '\n', message);

    if(this.currentTrend !== 'up') {
      if(this.trendDuration < settings.persistence)
        this.trendDuration += 1
      else {
        this.currentTrend = 'up';
        this.advice('long');
        if(settings.verbose) log.info('advice - BUY' + message);
        this.trendDuration = 1;
      }
    } else
      this.advice();
    message = message + ', UT: ' + this.trendDuration;

  } else if(macddiff < settings.sellTreshold) {
    if(settings.debug) log.info('we are currently in a downtrend duration' + this.trendDuration + '\n', message);

    if(this.currentTrend !== 'down') {
      if(this.trendDuration < settings.persistence)
        this.trendDuration += 1
      else {
        this.currentTrend = 'down';
        this.advice('short');
        // if(settings.verbose) log.info('advice - SELL' + message);
        this.trendDuration = 1;
      }
    } else
      this.advice();
    message = message + ', DT: ' + this.trendDuration;
  } else {
    // if(settings.debug) log.info('we are currently not in an up or down trend', message);
    this.advice();
    // Trend has ended so reset counter
    this.trendDuration = 1;
    message = message + ', NT: ' + this.trendDuration;
  }

}

TradingMethod.prototype.advice = function (newPosition) {
  if(!newPosition)
    return this.emit('soft advice');

  this.emit('advice', {
    recommandation: newPosition,
    portfolio: 1
  });
}

module.exports = TradingMethod;