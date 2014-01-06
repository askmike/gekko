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

  var macd = this.diff,
    price = this.lastCandle.c.toFixed(digits),
    long = this.ema.long.result.toFixed(digits),
    short = this.ema.short.result.toFixed(digits),
    signal = this.ema.signal.result,
    macddiff = macd - signal;

// following figures are all percentages so less digits needed
    digits = 3;
    macddiff = macddiff.toFixed(digits);
    signal = signal.toFixed(digits);

  if(typeof price === 'string')
    price = parseFloat(price);

  if(config.normal.exchange !== 'cexio')
    price = price.toFixed(3);

  var message = '@ P:' + price + ' (L:' + long + ', S:' + short + ', M:' + macd + ', s:' + signal + ', D:' + macddiff + ')';

  if(config.backtest.enabled)
    message += '\tat \t' + moment.unix(this.currentTimestamp).format('YYYY-MM-DD HH:mm:ss');

  if(macddiff > settings.buyThreshold) {

    if (this.currentTrend === 'down') this.trendDuration = 0;

    this.trendDuration += 1;

    if (this.trendDuration < settings.persistence )
      this.currentTrend = 'PendingUp';

    if ((this.currentTrend !== 'up') && (this.trendDuration >= settings.persistence)) {
        this.currentTrend = 'up';
        this.advice('long');
        message = 'MACD advice - BUY' + message;
    }
    else
      this.advice();
    
  } else if(macddiff < settings.sellThreshold) {

    if (this.currentTrend === 'up') this.trendDuration = 0;

    this.trendDuration += 1
    if (this.trendDuration < settings.persistence )
       this.currentTrend = 'PendingDown';

    if ((this.currentTrend !== 'down')  && (this.trendDuration >= settings.persistence)) {
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
  if(settings.verbose) 
    log.info('MACD:' + message + ', Trend: ' + this.currentTrend + ', Duration: ' + this.trendDuration);

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