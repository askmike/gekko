/*
  
  PPO - cykedev 15/01/2014

 */
// helpers
var _ = require('lodash');
var Util = require('util');
var log = require('../core/log.js');

var config = require('../core/util.js').getConfig();
var settings = config.PPO;

var PPO = require('./indicators/PPO.js');

var TradingMethod = function () {
  _.bindAll(this);

  this.currentTrend = 'none';
  this.trendDuration = 0;

  this.historySize = config.tradingAdvisor.historySize;
  this.ppo = new PPO(settings);
}

var Util = require('util');
var EventEmitter = require('events').EventEmitter;
Util.inherits(TradingMethod, EventEmitter);

TradingMethod.prototype.update = function(candle) {
  var price = candle.c;

  this.lastPrice = price;
  this.ppo.update(price);

  if(this.ppo.short.age < this.historySize)
    return;

  this.log();
  this.calculateAdvice();
}

// for debugging purposes log the last 
// calculated parameters.
TradingMethod.prototype.log = function () {
  var digits = 8;
  var short = this.ppo.short.result;
  var long = this.ppo.long.result;
  var macd = this.ppo.macd;
  var ppo = this.ppo.ppo;
  var macdSignal = this.ppo.MACDsignal.result;
  var ppoSignal = this.ppo.PPOsignal.result;

  log.debug('calced MACD properties for candle:');
  log.debug('\t', 'short:', short.toFixed(digits));
  log.debug('\t', 'long:', long.toFixed(digits));
  log.debug('\t', 'macd:', macd.toFixed(digits));
  log.debug('\t', 'macdsignal:', macdSignal.toFixed(digits));
  log.debug('\t', 'machist:', (macd - macdSignal).toFixed(digits));
  log.debug('\t', 'ppo:', ppo.toFixed(digits));
  log.debug('\t', 'pposignal:', ppoSignal.toFixed(digits));
  log.debug('\t', 'ppohist:', (ppo - ppoSignal).toFixed(digits));  
}

TradingMethod.prototype.calculateAdvice = function () {

  var price = this.lastPrice;
  var long = this.ppo.long.result;
  var short = this.ppo.short.result;
  var macd = this.ppo.macd;
  var ppo = this.ppo.result;
  var macdSignal = this.ppo.MACDsignal.result;
  var ppoSignal = this.ppo.PPOsignal.result;
  var macdHist = macd - macdSignal;
  var ppoHist = ppo - ppoSignal;

  if(ppoHist > settings.buyThreshold) {

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
    
  } else if(ppoHist < settings.sellThreshold) {

    if(this.currentTrend === 'up') this.trendDuration = 0;

    this.trendDuration += 1;
    if(this.trendDuration < settings.persistence)
       this.currentTrend = 'PendingDown';

    if(this.currentTrend !== 'down' && this.trendDuration >= settings.persistence) {
      this.currentTrend = 'down';
      this.advice('short');
    } else
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
