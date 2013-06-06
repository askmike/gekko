/*
  
  This method uses `Exponential Moving Average crossovers` to determine the current trend the
  market is in. Using this information it will suggest to ride the trend. Note that this is
  not MACD because it just checks whether the longEMA and shortEMA are [threshold]% removed
  from eachother.

  @link http://en.wikipedia.org/wiki/Exponential_moving_average#Exponential_moving_average

  This method is fairly popular in bitcoin trading due to Bitcointalk user Goomboo.

  @link https://bitcointalk.org/index.php?topic=60501.0
 */

var EventEmitter = require('events').EventEmitter;

// helpers
var moment = require('moment');
var _ = require('underscore');
var util = require('../util.js');
var Util = require('util');
var log = require('../log.js');

var config = util.getConfig();
var EMAsettings = config.EMA;

var TradingMethod = function(watcher) {
  this.watcher = watcher;
  this.currentTrend;
  this.amount = EMAsettings.ticks + 1;
  // this array stores _all_ ticks (with each a price, shortEMA, longEMA, diff) in chronological order
  this.ticks = [];

  _.bindAll(this);

  this.on('start', this.start);
}

Util.inherits(TradingMethod, EventEmitter);

TradingMethod.prototype.start = function() {
  log.info('Calculating EMA on historical data...');
  this.callback = this.advice;
  this.getTicks();
  setInterval(this.refresh, util.minToMs( EMAsettings.interval) );
}

// fetch the price of all remaining ticks and calculate 
// the short & long EMA and the difference for these ticks.
TradingMethod.prototype.getTicks = function() {
  this.current = this.amount - this.ticks.length;
  // get the date of the tick we are fetching
  var tickTime = util.intervalsAgo(this.current);

  if(this.current)
    var since = tickTime;
  else
    // if this is the last tick just fetch the latest trades
    var since = null;
  log.debug('fetching exchange...');
  this.watcher.getTrades(since, this.processTrades);
}

TradingMethod.prototype.processTrades = function(err, trades) {
  if (err || !trades)
    return this.serverError();

  trades = trades.data;
  if (trades.length === 0)
    return this.serverError();

  log.debug('fetched exchange');

  // if we are fetching the last tick we are interested
  // in the most recent prices of the batch instead of the
  // most dated ones
  var price = this.calculatePrice(trades, !this.current);
  this.calculateTick(price);

  // check if the fetched trades can be used to
  // calculate remaining ticks
  var outOfTrades = false, nextTreshold;
  while(!outOfTrades && this.current > 1) {
    nextTreshold = util.intervalsAgo(this.current - 1);

    outOfTrades = _.every(trades, function(trade, i) {
      // if next treshold is in this batch
      if(moment.unix(trade.date) > nextTreshold) {
        trades.splice(0, i);
        return false;
      }
      return true;
    });

    if(!outOfTrades) {
      this.current -= 1;
      price = this.calculatePrice(trades, !(this.current - 1));
      this.calculateTick(price);
    }
  }

  // recurse if we don't have all ticks yet
  if(this.current > 1)
    return this.getTicks();

  // we're done
  // module.exports.emit('monitoring');
  if(this.callback) this.callback();
  this.callback = false;
}

// calculate the average trade price out of a sample of trades.
// The sample consists of all trades that are between the oldest 
// dated trade up to (oldest + sampleSize).
// 
// if newestFirst is true we are instead interested in the most 
// recent trades up to (newest - sampleSize)
TradingMethod.prototype.calculatePrice = function(trades, newestFirst) {
  if(newestFirst) {
    trades = trades.reverse();
    var treshold = moment.unix(_.first(trades).date).subtract('seconds', EMAsettings.sampleSize);
    return util.calculatePriceSince(treshold, trades);
  }

  var treshold = moment.unix(_.first(trades).date).add('seconds', EMAsettings.sampleSize);
  return util.calculatePriceTill(treshold, trades);
}

// add a price and calculate the EMAs and
// the diff for that price
TradingMethod.prototype.calculateTick = function(price) {
  var tick = {
    price: price,
    shortEMA: false,
    longEMA: false,
    diff: false
  };

  this.ticks.push(tick);

  this.calculateEMA('shortEMA');
  this.calculateEMA('longEMA');
  this.calculateEMAdiff();
  log.debug(
    'calculated new tick: ' +
    (this.amount - this.ticks.length) +
    '\tprice: ' +
    _.last(this.ticks).price.toFixed(3) +
    '\tdiff: ' +
    _.last(this.ticks).diff.toFixed(3)
  );
}

//    calculation (based on tick/day):
//  EMA = Price(t) * k + EMA(y) * (1 – k)
//  t = today, y = yesterday, N = number of days in EMA, k = 2 / (N+1)
TradingMethod.prototype.calculateEMA = function(type) {
  var k = 2 / (EMAsettings[type] + 1);
  var ema, y;

  var current = this.ticks.length;

  if(current === 1)
    // we don't have any 'yesterday'
    y = _.first(this.ticks).price;
  else
    y = this.ticks[current - 2][type];
  
  ema = _.last(this.ticks).price * k + y * (1 - k);
  this.ticks[current - 1][type] = ema;
}

// @link https://github.com/virtimus/GoxTradingBot/blob/85a67d27b856949cf27440ae77a56d4a83e0bfbe/background.js#L145
TradingMethod.prototype.calculateEMAdiff = function() {
  var tick = _.last(this.ticks);
  var shortEMA = tick.shortEMA;
  var longEMA = tick.longEMA;

  var diff = 100 * (shortEMA - longEMA) / ((shortEMA + longEMA) / 2);
  this.ticks[ this.ticks.length - 1 ].diff = diff;
}

TradingMethod.prototype.advice = function() {
  var tick = _.last(this.ticks);
  var diff = tick.diff.toFixed(3);
  var price = tick.price.toFixed(3);
  var message = '@ ' + price + ' (' + diff + ')';

  if(tick.diff > EMAsettings.buyTreshold) {
    log.debug('we are currently in uptrend (' + diff + ')');

    if(this.currentTrend !== 'up') {
      this.currentTrend = 'up';
      this.emit('advice', 'BUY', price, message);
    } else {
      this.emit('advice', 'HOLD', price, message);
    }

  } else if(tick.diff < EMAsettings.sellTreshold) {
    log.debug('we are currently in a downtrend  (' + diff + ')');

    if(this.currentTrend !== 'down') {
      this.currentTrend = 'down';
      this.emit('advice', 'SELL', price, message);
    } else {
      this.emit('advice', 'HOLD', price, message);
    }

  } else {
    log.debug('we are currently not in an up or down trend  (' + diff + ')');
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

TradingMethod.prototype.serverError = function() {
  log.error('Server responded with an error or no data, sleeping.');
  setTimeout(this.getTicks, util.minToMs(0.5));
};

module.exports = TradingMethod;