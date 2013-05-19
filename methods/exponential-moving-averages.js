/*
  
  This method uses `Exponential Moving Average` to determine the current trend the
  market is in (either up or down). Using this information it will suggest to ride
  the trend.

  @link http://en.wikipedia.org/wiki/Exponential_moving_average#Exponential_moving_average

  This method is fairly popular in bitcoin trading due to Bitcointalk user Goomboo.

  @link https://bitcointalk.org/index.php?topic=60501.0


      Method state: ALPHA: need to test

 */

// set up events so this method can talk with Gekko
var EventEmitter = require('events').EventEmitter;
module.exports = new EventEmitter();

// helpers
var moment = require('moment');
var _ = require('underscore');
var util = require('../util.js');

var mtgox, config, currentTrend;
// this array stores _all_ price data
var candles = [];

var log = function(m) {
  config.debug && console.log('(DEBUG) ', util.now(), m);
}

// fetch the price of all remaining candles and calculate 
// the short & long EMA and the difference for these candles.
var getCandles = function(callback) {
  var current = config.candles - candles.length;
  // get the date of the candle we are fetching
  var candleTime = util.intervalsAgo(current);

  var since = current ? util.toMicro(candleTime) : null;
  mtgox.fetchTrades(since, function(err, trades) {
    if (err) throw err;
    log('fetched mtgox');

    trades = trades.data;
    if (trades.length === 0) throw 'exchange responded with zero trades';

    // if we are fetching the last candle we are interested 
    // in the most recent prices of the batch instead of the
    // most dated ones
    var price = calculatePrice(trades, !current);
    calculateCandle(price);
    
    // check if the fetched trades can be used to 
    // calculate remaining candles
    var outOfTrades = false, nextTreshold;
    while(!outOfTrades && current > 1) {
      nextTreshold = util.intervalsAgo(current - 1);

      outOfTrades = _.every(trades, function(trade, i) {
        // if next treshold is in this batch
        if(moment.unix(trade.date) > nextTreshold) {
          trades.splice(0, i);
          return false;
        }
        return true;
      });

      if(!outOfTrades) {
        price = calculatePrice(trades);
        calculateCandle(price);
        current -= 1;
      }
    }

    // recurse if we don't have all candles yet
    if(current)
      return getCandles(callback);
    
    // we're done
    module.exports.emit('monitoring');
    callback();
  });
}

// calculate the average trade price out of a sample of trades.
// The sample consists of all trades that are between the oldest 
// dated trade up to (oldest + sampleSize).
// 
// if newestFirst is true we are instead interested in the most 
// recent trades up to (newest - sampleSize)
var calculatePrice = function(trades, newestFirst) {
  if(newestFirst) {
    trades = trades.reverse();
    var treshold = moment.unix(_.first(trades).date).subtract('seconds', config.sampleSize);
    return util.calculatePriceSince(treshold, trades);
  }

  var treshold = moment.unix(_.first(trades).date).add('seconds', config.sampleSize);
  return util.calculatePriceTill(treshold, trades);
}

// add a price and calculate the EMAs and
// the diff for that price
var calculateCandle = function(price) {
  log('calculated new candle: ' + (config.candles - candles.length));
  var candle = {
    price: price,
    shortEMA: false,
    longEMA: false,
    diff: false
  };

  candles.push(candle);
  calculateEMA('shortEMA');
  calculateEMA('longEMA');
  calculateEMAdiff();
}

//    calculation (based on candle/day):
//  EMA = Price(t) * k + EMA(y) * (1 – k)
//  t = today, y = yesterday, N = number of days in EMA, k = 2 / (N+1)
var calculateEMA = function(type) {
  var k = 2 / (config[type] + 1);
  var ema, y;

  var current = candles.length;

  if(current === 1)
    // we don't have any 'yesterday'
    y = candles[0].price;
  else
    y = candles[current - 2][type];

  ema = candles[current - 1].price * k + y * (1 - k);
  candles[current - 1][type] = ema;
}

// @link https://github.com/virtimus/GoxTradingBot/blob/85a67d27b856949cf27440ae77a56d4a83e0bfbe/background.js#L145
var calculateEMAdiff = function() {
  var candle = _.last(candles);
  var shortEMA = candle.shortEMA;
  var longEMA = candle.longEMA;

  var diff = 100 * (shortEMA - longEMA) / ((shortEMA + longEMA) / 2);
  candles[ candles.length - 1 ].diff = diff;
}

var advice = function() {
  var candle = _.last(candles);
  var diff = candle.diff.toFixed(3)
  var logPrice = '@ ' + candle.price.toFixed(3) + ' (' + diff + ')';

  if(candle.diff > config.buyTreshold) {
    log('we are currently in uptrend (' + diff + ')');

    if(currentTrend !== 'up') {
      currentTrend = 'up';
      module.exports.emit('advice', 'BUY', logPrice);
    } else {
      module.exports.emit('advice', 'HOLD', logPrice);
    }

  } else if(candle.diff < config.sellTreshold) {
    log('we are currently in a downtrend  (' + diff + ')');

    if(currentTrend !== 'down') {
      currentTrend = 'down';
      module.exports.emit('advice', 'SELL', logPrice);
    } else {
      module.exports.emit('advice', 'HOLD', logPrice);
    }

  } else {
    log('we are currently not in an up or down trend  (' + diff + ')');

    if(currentTrend !== 'none') {
      currentTrend = 'none';
      module.exports.emit('advice', 'HOLD', logPrice);
    }

  }
}

var refresh = function() {
  log('refreshing');

  // remove the oldest candle
  candles.splice(0, 1);

  // get new candle
  getCandles(advice);
}

var init = function(c, m) {
  config = c;
  mtgox = m;
  util.set(c);

  getCandles(advice);
  setInterval(refresh, util.minToMs( config.interval) );
}

module.exports.on('init', init);