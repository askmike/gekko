/*
  
  This method uses `Exponential Moving Average crossovers` to determine the current trend the
  market is in. Using this information it will suggest to ride the trend. Note that this is
  not MACD because it just checks whether the longEMA and shortEMA are [threshold]% removed
  from eachother.

  This method is fairly popular in bitcoin trading due to Bitcointalk user Goomboo.

  @link https://bitcointalk.org/index.php?topic=60501.0
 */

// helpers
var moment = require('moment');
var _ = require('lodash');
var util = require('../core/util.js');
var Util = require('util');
var log = require('../core/log.js');

var config = util.getConfig();
var settings = config.EMA;

// required indicators
var EMA = require('./indicators/exponantial-moving-average.js');

var backtesting = config.backtest.enabled;
if(backtesting)
  throw ':(';
  // settings = _.extend(settings, config.backtest);

var TradingMethod = function() {
  _.bindAll(this);

  this.currentTrend;  

  this.diff;
  this.ema = {
    short: new EMA(settings.short),
    long: new EMA(settings.long)
  };
}

var Util = require('util');
var EventEmitter = require('events').EventEmitter;
Util.inherits(TradingMethod, EventEmitter);

TradingMethod.prototype.init = function(history) {
  _.each(history.candles, function(candle) {
    this.calculateEMAs(candle);
  }, this);
  this.lastCandle = _.last(history.candles);
  this.advice();
}

TradingMethod.prototype.update = function(candle) {
  this.lastCandle = candle;
  this.calculateEMAs(candle);
  this.log();
  this.advice();
}


// add a price and calculate the EMAs and
// the diff for that price
TradingMethod.prototype.calculateEMAs = function(candle) {
  _.each(['short', 'long'], function(type) {
    this.ema[type].update(candle);
  }, this);
  this.calculateEMAdiff();
}

// for debugging purposes: log the last calculated
// EMAs and diff.
TradingMethod.prototype.log = function() {
  log.debug('calced EMA properties for candle:');
  _.each(['short', 'long'], function(e) {
    if(config.watch.exchange === 'cexio')
      log.debug('\t', e, 'ema', this.ema[e].result.toFixed(8));
    else
      log.debug('\t', e, 'ema', this.ema[e].result.toFixed(3));
  }, this);
  log.debug('\t diff', this.diff.toFixed(4));
}

// @link https://github.com/virtimus/GoxTradingBot/blob/85a67d27b856949cf27440ae77a56d4a83e0bfbe/background.js#L145
TradingMethod.prototype.calculateEMAdiff = function() {
  var shortEMA = this.ema.short.result;
  var longEMA = this.ema.long.result;

  this.diff = 100 * (shortEMA - longEMA) / ((shortEMA + longEMA) / 2);
}

TradingMethod.prototype.advice = function() {
  // @ cexio we need to be more precise due to low prices
  // and low margins on trade.  All others use 3 digist.

  var diff = this.diff.toFixed(3),
      price = this.lastCandle.c.toFixed(8);

  if(typeof price === 'string')
    price = parseFloat(price);

  if(config.normal.exchange !== 'cexio')
    price = price.toFixed(3);

  var message = '@ ' + price + ' (' + diff + ')';

  if(config.backtest.enabled)
    message += '\tat \t' + moment.unix(this.currentTimestamp).format('YYYY-MM-DD HH:mm:ss');

  if(diff > settings.buyTreshold) {
    log.debug('we are currently in uptrend (' + diff + ')');

    if(this.currentTrend !== 'up') {
      this.currentTrend = 'up';
      this.emit('advice', 'BUY', price, message);
    } else
      this.emit('advice', 'HOLD', price, message);

  } else if(diff < settings.sellTreshold) {
    log.debug('we are currently in a downtrend', message);

    if(this.currentTrend !== 'down') {
      this.currentTrend = 'down';
      this.emit('advice', 'SELL', price, message);
    } else
      this.emit('advice', 'HOLD', price, message);

  } else {
    log.debug('we are currently not in an up or down trend', message);
    this.emit('advice', 'HOLD', price, message);
  }
}

module.exports = TradingMethod;
