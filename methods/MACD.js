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

  this.currentTrend = 'none';
  this.trendDuration = 0;

  this.historySize = config.tradingAdvisor.historySize;

  this.macd = new MACD(settings);
}

var Util = require('util');
var EventEmitter = require('events').EventEmitter;
Util.inherits(TradingMethod, EventEmitter);

TradingMethod.prototype.update = function(candle) {
  var price = candle.c;

  this.lastPrice = price;;
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

  log.debug('calced MACD properties for candle:');
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

  if(macddiff > settings.buyThreshold) {

    if(this.currentTrend === 'down')
      this.trendDuration = 0;

    this.trendDuration += 1;

    if(this.trendDuration < settings.persistence)
      this.currentTrend = 'PendingUp';

    if(this.currentTrend !== 'up' && this.trendDuration >= settings.persistence) {
      this.currentTrend = 'up';
      this.advice('long');
    } else
      this.advice();
    
  } else if(macddiff < settings.sellThreshold) {

    if(this.currentTrend === 'up') this.trendDuration = 0;

    this.trendDuration += 1;
    if(this.trendDuration < settings.persistence)
       this.currentTrend = 'PendingDown';

    if(this.currentTrend !== 'down' && this.trendDuration >= settings.persistence) {
      this.currentTrend = 'down';
      this.advice('short');
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
