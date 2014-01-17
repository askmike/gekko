/*
  
  PPO - cykedev 15/01/2014

 */
// helpers
var moment = require('moment');
var _ = require('lodash');
var util = require('../core/util.js');
var Util = require('util');
var log = require('../core/log.js');

var config = util.getConfig();
var settings = config.PPO;

var EMA = require('./indicators/EMA.js');

var TradingMethod = function () {
  _.bindAll(this);

  this.currentTrend = 'none';
  this.trendDuration = 0;

  this.historySize = config.tradingAdvisor.historySize;

  this.macd;
  this.ppo;
  this.ema = {
    short: new EMA(settings.short),
    long: new EMA(settings.long),
    macdSignal: new EMA(settings.signal),
    ppoSignal: new EMA(settings.signal)
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
  // the MACD and PPO
  this.calculatePPO();
  // the signal
  this.ema['macdSignal'].update(this.macd);
  this.ema['ppoSignal'].update(this.ppo);
}

// for debugging purposes log the last 
// calculated parameters.
TradingMethod.prototype.log = function () {
  var digits = 8;
  var macd = this.macd;
  var ppo = this.ppo;
  var macdSignal = this.ema.macdSignal.result;
  var ppoSignal = this.ema.ppoSignal.result;

  log.debug('calced MACD properties for candle:');
  log.debug('\t', 'short:', this.ema.short.result.toFixed(digits));
  log.debug('\t', 'long:', this.ema.long.result.toFixed(digits));
  log.debug('\t', 'macd:', macd.toFixed(digits));
  log.debug('\t', 'macdsignal:', macdSignal.toFixed(digits));
  log.debug('\t', 'machist:', (macd - macdSignal).toFixed(digits));
  log.debug('\t', 'ppo:', ppo.toFixed(digits));
  log.debug('\t', 'pposignal:', ppoSignal.toFixed(digits));
  log.debug('\t', 'ppohist:', (ppo - ppoSignal).toFixed(digits));  
}

// @link http://stockcharts.com/school/doku.php?id=chart_school:technical_indicators:price_oscillators_pp
TradingMethod.prototype.calculatePPO = function () {
  var shortEMA = this.ema.short.result;
  var longEMA = this.ema.long.result;
  this.macd = shortEMA - longEMA;
  this.ppo = 100 * (this.macd / longEMA);
}

TradingMethod.prototype.calculateAdvice = function () {

  var price = this.lastCandle.c;
  var long = this.ema.long.result;
  var short = this.ema.short.result;
  var macd = this.macd;
  var ppo = this.ppo;
  var macdSignal = this.ema.macdSignal.result;
  var ppoSignal = this.ema.ppoSignal.result;
  var macdHist = macd - macdSignal;
  var ppoHist = ppo - ppoSignal;

  var message = [
    '@ P:',
    price.toFixed(3),
    ' (L:',
    long.toFixed(3),
    ', S:',
    short.toFixed(3),
    ', M:',
    macd.toFixed(3),
    ', Ms:',
    macdSignal.toFixed(3),
    ', Mh:',
    macdHist.toFixed(3),
    ', P:',
    ppo.toFixed(3),
    ', Ps:',
    ppoSignal.toFixed(3),
    ', Ph:',
    ppoHist.toFixed(3),
    ')'
    ].join('');

  if(ppoHist > settings.buyThreshold) {

    if(this.currentTrend === 'down')
      this.trendDuration = 0;

    this.trendDuration += 1;

    if(this.trendDuration < settings.persistence )
      this.currentTrend = 'PendingUp';

    if(this.currentTrend !== 'up' && this.trendDuration >= settings.persistence) {
        this.currentTrend = 'up';
        this.advice('long');
        message = 'PPO advice - BUY' + message;
    }
    else
      this.advice();
    
  } else if(ppoHist < settings.sellThreshold) {

    if(this.currentTrend === 'up') this.trendDuration = 0;

    this.trendDuration += 1;
    if(this.trendDuration < settings.persistence )
       this.currentTrend = 'PendingDown';

    if(this.currentTrend !== 'down' && this.trendDuration >= settings.persistence) {
        this.currentTrend = 'down';
        this.advice('short');
        message = 'PPO Advice - SELL' + message;
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
