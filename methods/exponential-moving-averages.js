/*
  
  This method uses `Exponential Moving Average crossovers` to determine the current trend the
  market is in. Using this information it will suggest to ride the trend. Note that this is
  not MACD because it just checks whether the longEMA and shortEMA are [threshold]% removed
  from eachother.

  @link http://en.wikipedia.org/wiki/Exponential_moving_average#Exponential_moving_average

  This method is fairly popular in bitcoin trading due to Bitcointalk user Goomboo.

  @link https://bitcointalk.org/index.php?topic=60501.0
 */

// helpers
var moment = require('moment');
var _ = require('lodash');
var util = require('../util.js');
var Util = require('util');
var log = require('../log.js');

var config = util.getConfig();
var settings = config.EMA;
var backtesting = config.backtest.enabled;
if(backtesting)
  settings = _.extend(settings, config.backtest);

var TradingMethod = function(watcher) {
  this.watcher = watcher;
  this.currentTrend;
  this.amount = settings.ticks + 1;
  // store EMAsettings
  this.settings = settings;
  // store whole config
  this.config = config;

  _.bindAll(this);

  this.on('prepare', this.prepare);
  this.on('prepared', this.start);
  this.on('calculated candle', this.calculateEMAs);
}

if(backtesting)
  var CandleMethod = require('./historical-candle-fetcher.js');
else
  var CandleMethod = require('./realtime-candle-fetcher.js');
Util.inherits(TradingMethod, CandleMethod);

// first prepare this trading method, then
// prepare the candleMethod this trade method 
// is extending.
TradingMethod.prototype.prepare = function() {
  log.info('Calculating EMA on historical data...');
  // setup method specific parameters
  this.ema = {
    short: [],
    long: [],
    diff: []
  };

  this.set();
}

TradingMethod.prototype.start = function() {
  if(backtesting) {
    this.on('calculated new candle', this.getNewCandle);
    this.getHistoricalCandles();
  } else {
    this.getHistoricalCandles();
    setInterval(this.getNewCandle, util.minToMs( settings.interval ) );
  }
}

// add a price and calculate the EMAs and
// the diff for that price
TradingMethod.prototype.calculateEMAs = function() {
  if(!this.fetchingHistorical) {
    // we need to remove the oldest EMAs
    this.ema.short.shift();
    this.ema.long.shift();
    this.ema.diff.shift();
  }

  this.calculateEMA('short');
  this.calculateEMA('long');
  this.calculateEMAdiff();

  log.debug('calced EMA properties for new candle:');
  _.each(['short', 'long', 'diff'], function(e) {
    if(config.normal.exchange === 'cexio')
      log.debug('\t', e, 'ema', _.last(this.ema[e]).toFixed(8));
    else
      log.debug('\t', e, 'ema', _.last(this.ema[e]).toFixed(3));
  }, this);

  if(!this.fetchingHistorical)
    this.advice();
}

//    calculation (based on tick/day):
//  EMA = Price(t) * k + EMA(y) * (1 – k)
//  t = today, y = yesterday, N = number of days in EMA, k = 2 / (N+1)
TradingMethod.prototype.calculateEMA = function(type) {
  var price = _.last(this.candles.close);

  var k = 2 / (settings[type] + 1);
  var ema, y;

  var current = _.size(this.candles.close);

  if(current === 1)
    // we don't have any 'yesterday'
    y = price;
  else
    y = this.ema[type][current - 2];
  
  ema = price * k + y * (1 - k);
  
  if(!ema){
    //in case of empty ema value (e.g. bitcoincharts downtime) take the last ema value
    ema = _.last(this.ema[type]);
    log.debug('WARNING: Unable to calculate EMA on current candle. Using last defined value.');
  }
  
  this.ema[type].push(ema);
}

// @link https://github.com/virtimus/GoxTradingBot/blob/85a67d27b856949cf27440ae77a56d4a83e0bfbe/background.js#L145
TradingMethod.prototype.calculateEMAdiff = function() {
  var shortEMA = _.last(this.ema.short);
  var longEMA = _.last(this.ema.long);

  var diff = 100 * (shortEMA - longEMA) / ((shortEMA + longEMA) / 2);
  this.ema.diff.push(diff);
}

TradingMethod.prototype.advice = function() {
  // @ cexio we need to be more precise due to low prices
  // and low margins on trade.  All others use 3 digist.

  var diff = _.last(this.ema.diff).toFixed(3),
      price = _.last(this.candles.close).toFixed(8);

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

TradingMethod.prototype.refresh = function() {
  log.debug('refreshing');

  // remove the oldest tick
  this.ticks.splice(0, 1);

  // get new tick
  this.callback = this.advice;
  this.getTicks();
}

module.exports = TradingMethod;
