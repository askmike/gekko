// set up events so this method can talk with Gekko
var EventEmitter = require('events').EventEmitter;
module.exports = new EventEmitter();

// helpers
var moment = require('moment');
var _ = require('underscore');
var util = require('../util.js');

var mtgox, config;
var candles = {
  prices: [],
  longEMAs: [],
  shortEMAs: [],
  difs: []
};

// fetch the price of all remaining candles and calculate 
// the short & long EMA and the difference for these candles.
var getCandles = function(next) {
  var current = config.candles - candles.prices.length;
  var at = util.intervalsAgo(current);

  // get the date of the candle we are fetching
  var since = current ? util.toMicro(at) : null;
  mtgox.fetchTrades(since, function(err, trades) {
    if (err) throw err;
    if (trades.data.length === 0) throw 'exchange responded with zero trades';

    // treshold is the addition of the date of the first trade and the sampleSize
    var treshold = moment.unix(trades.data[0].date).add('minutes', config.sampleSize);
    var overTreshold = false;
    // create a sample of trades that happened before the treshold
    var sample = _.filter(trades.data, function(trade) {
      if(overTreshold || moment.unix(trade.date) < treshold)
        return true;
      
      overTreshold = true;
      return false; 
    });

    var prices = _.map(sample, function(trade) {
      return parseFloat(trade.price);
    });

    candles.prices.push( util.average(prices) );
    calcEMA('shortEMA');
    calcEMA('longEMA');
    calcEMAdif();

    // recurse if we don't have all candles yet
    if(current)
      return getCandles(next);
    
    // else we're done
    module.exports.emit('watching');
    next();
  });
}

//    calculation (based on candle/day):
//  EMA = Price(t) * k + EMA(y) * (1 – k)
//  t = today, y = yesterday, N = number of days in EMA, k = 2 / (N+1)
var calcEMA = function(type) {
  var k = 2 / (config[type] + 1);
  var ema, y;

  var current = candles.prices.length;
  if(current === 1)
    // we don't have any 'yesterday'
    y = candles.prices[0];
  else
    y = candles[type + 's'][current - 2];

  ema = candles.prices[current - 1] * k + y * (1 - k);
  candles[type + 's'].push(ema);
}

// @link https://github.com/virtimus/GoxTradingBot/blob/85a67d27b856949cf27440ae77a56d4a83e0bfbe/background.js#L145
var calcEMAdif = function() {
  var current = candles.prices.length - 1;
  var shortEMA = candles.shortEMAs[current];
  var longEMA = candles.longEMAs[current];

  var dif = 100 * (shortEMA - longEMA) / ((shortEMA + longEMA) / 2);
  candles.difs.push(dif); 
}

var init = function(c, m) {
  config = c;
  mtgox = m;
  util.set(c);

  // fetch and calculate all prices
  var done = function() { console.log('done', candles); };
  getCandles(done);
}

module.exports.on('init', init);