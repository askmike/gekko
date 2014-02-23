/*
  
  RSI - cykedev 14/02/2014

 */
// helpers
var _ = require('lodash');
var Util = require('util');
var log = require('../core/log.js');

var config = require('../core/util.js').getConfig();
var settings = config.RSI;

var RSI = require('./indicators/RSI.js');

var TradingMethod = function() {
  _.bindAll(this);

  this.trend = {
    direction: 'none',
    duration: 0,
    persisted: false,
    adviced: false
  };

  this.historySize = config.tradingAdvisor.historySize;
  this.rsi = new RSI(settings.interval);
}

var Util = require('util');
var EventEmitter = require('events').EventEmitter;
Util.inherits(TradingMethod, EventEmitter);

TradingMethod.prototype.update = function(candle) {
  this.lastPrice = candle.c;
  this.rsi.update(candle.o, candle.c);

  if(this.rsi.age < this.historySize)
    return;

  this.log();
  this.calculateAdvice();
}

// for debugging purposes log the last 
// calculated parameters.
TradingMethod.prototype.log = function() {
  var digits = 8;

  log.debug('calculated RSI properties for candle:');
  log.debug('\t', 'rsi:', this.rsi.rsi.toFixed(digits));
  log.debug('\t', 'price:', this.lastPrice.toFixed(digits));
}

TradingMethod.prototype.calculateAdvice = function() {
  var rsiVal = this.rsi.rsi;

  if(rsiVal > settings.thresholds.high) {

    // new trend detected
    if(this.trend.direction !== 'high')
      this.trend = {
        duration: 0,
        persisted: false,
        direction: 'high',
        adviced: false
      };

    this.trend.duration++;

    log.debug('In high since', this.trend.duration, 'candle(s)');

    if(this.trend.duration >= settings.thresholds.persistence)
      this.trend.persisted = true;

    if(this.trend.persisted && !this.trend.adviced) {
      this.trend.adviced = true;
      this.advice('short');
    } else
      this.advice();
    
  } else if(rsiVal < settings.thresholds.low) {

    // new trend detected
    if(this.trend.direction !== 'low')
      this.trend = {
        duration: 0,
        persisted: false,
        direction: 'low',
        adviced: false
      };

    this.trend.duration++;

    log.debug('In low since', this.trend.duration, 'candle(s)');

    if(this.trend.duration >= settings.thresholds.persistence)
      this.trend.persisted = true;

    if(this.trend.persisted && !this.trend.adviced) {
      this.trend.adviced = true;
      this.advice('long');
    } else
      this.advice();

  } else {

    log.debug('In no trend');

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
