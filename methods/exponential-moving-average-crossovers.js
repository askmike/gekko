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

var TradingMethod = function() {
  _.bindAll(this);

  this.currentTrend;

  this.diff;
  this.ema = {
    short: new EMA(settings.short),
    long: new EMA(settings.long)
  };
}

// teach our trading method events
var Util = require('util');
var EventEmitter = require('events').EventEmitter;
Util.inherits(TradingMethod, EventEmitter);

TradingMethod.prototype.init = function(history) {
  var candles = history.candles;
  var last = candles.pop();

  // insert history
  _.each(candles, this.calculateEMAs, this);

  // update with last candle
  this.update(last);
}

TradingMethod.prototype.update = function(candle) {
  this.lastCandle = candle;
  this.calculateEMAs(candle);
  this.log();
  this.calculateAdvice();
}

// add a price and calculate the EMAs and
// the diff for that price
TradingMethod.prototype.calculateEMAs = function(candle) {
  _.each(['short', 'long'], function(type) {
    this.ema[type].update(candle.c);
  }, this);
  this.calculateEMAdiff();
}

// for debugging purposes: log the last calculated
// EMAs and diff.
TradingMethod.prototype.log = function() {
  log.debug('calced EMA properties for candle:');
  _.each(['short', 'long'], function(e) {
    log.debug('\t', e, 'ema:', this.ema[e].result.toFixed(8));
  }, this);
  log.debug('\t diff:', this.diff.toFixed(5));
  log.debug('\t ema age:', this.ema.short.age, 'candles');
}

// @link https://github.com/virtimus/GoxTradingBot/blob/85a67d27b856949cf27440ae77a56d4a83e0bfbe/background.js#L145
TradingMethod.prototype.calculateEMAdiff = function() {
  var shortEMA = this.ema.short.result;
  var longEMA = this.ema.long.result;

  this.diff = 100 * (shortEMA - longEMA) / ((shortEMA + longEMA) / 2);
}

TradingMethod.prototype.calculateAdvice = function() {
  var diff = this.diff;
  var price = this.lastCandle.c;

  var message = '@ ' + price.toFixed(8) + ' (' + diff.toFixed(5) + ')';

  if(diff > settings.buyTreshold) {
    log.debug('we are currently in uptrend', message);

    if(this.currentTrend !== 'up') {
      this.currentTrend = 'up';
      this.advice('long');
    } else
      this.advice();

  } else if(diff < settings.sellTreshold) {
    log.debug('we are currently in a downtrend', message);

    if(this.currentTrend !== 'down') {
      this.currentTrend = 'down';
      this.advice('short');
    } else
      this.advice();

  } else {
    log.debug('we are currently not in an up or down trend', message);
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
