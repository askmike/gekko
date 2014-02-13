// helpers
var _ = require('lodash');
var log = require('../core/log.js');

// configuration
var config = require('../core/util.js').getConfig();
var settings = config.DEMA;

// indicators
var DEMA = require('./indicators/DEMA');

// let's create our own method
var method = {};
method.init = function() {
  this.currentTrend;
  this.requiredHistory = config.tradingAdvisor.historySize;
  this.dema = new DEMA(settings);
}

method.update = function(candle) {
  var price = candle.c;
  this.lastPrice = price;
  this.dema.update(price);
}

// for debugging purposes: log the last calculated
// EMAs and diff.
method.log = function() {
  log.debug('calculated DEMA properties for candle:');
  log.debug('\t', 'long ema:', this.dema.long.result.toFixed(8));
  log.debug('\t', 'short ema:', this.dema.short.result.toFixed(8));
  log.debug('\t diff:', this.dema.result.toFixed(5));
  log.debug('\t DEMA age:', this.dema.short.age, 'candles');
}

method.check = function() {
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

module.exports = method;
