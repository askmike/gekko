// helpers
var _ = require('lodash');
var Util = require('util');
var log = require('../core/log.js');

var config = require('../core/util.js').getConfig();
var settings = config.DEMA;

// required indicators
var DEMA = require('./indicators/DEMA.js');

var TradingMethod = function() {
  _.bindAll(this);

  this.currentTrend;
  this.historySize = config.tradingAdvisor.historySize;
  this.dema = new DEMA(settings);
}

// teach our trading method events
var Util = require('util');
var EventEmitter = require('events').EventEmitter;
Util.inherits(TradingMethod, EventEmitter);

TradingMethod.prototype.update = function(candle) {
  var price = candle.c;

  this.lastPrice = price;
  this.dema.update(price);

  if(this.dema.short.age < this.historySize)
    return;

  this.log();
  this.calculateAdvice();
}

// for debugging purposes: log the last calculated
// EMAs and diff.
TradingMethod.prototype.log = function() {
  log.debug('calculated DEMA properties for candle:');
  log.debug('\t', 'long ema:', this.dema.long.result.toFixed(8));
  log.debug('\t', 'short ema:', this.dema.short.result.toFixed(8));
  log.debug('\t diff:', this.dema.result.toFixed(5));
  log.debug('\t DEMA age:', this.dema.short.age, 'candles');
}

TradingMethod.prototype.calculateAdvice = function() {
  var diff = this.dema.result;
  var price = this.lastPrice;

  var message = '@ ' + price.toFixed(8) + ' (' + diff.toFixed(5) + ')';

  if(diff > settings.thresholds.up) {
    log.debug('we are currently in uptrend', message);

    if(this.currentTrend !== 'up') {
      this.currentTrend = 'up';
      this.advice('long');
    } else
      this.advice();

  } else if(diff < settings.thresholds.down) {
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
