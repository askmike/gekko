// set up events so this method can communicate with Gekko
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
  shortEMAs: []
};

// Fetch the price of all remaining candles and calculate 
// the short & long EMA and the difference for these candles.
var getCandles = function(next) {
  var current = config.candles - candles.prices.length;
  var at = util.intervalsAgo(current)
  var since = util.toMicro(at);

  mtgox.fetchTrades(since, function(err, trades) {
    if (err) throw err;

    // create a sample out of trades who where executed between 
    // since and (since + sampleSize in minutes)
    var treshold = at.add('minutes', config.sampleSize);
    // TODO: optimize so that we stop searching when first hit 
    // above treshold is found
    var sample = _.filter(trades.data, function(trade) {
      return moment.unix(trade.date) < treshold;
    });
    var prices = _.map(sample, function(trade) {
      return parseFloat(trade.price);
    });

    candles.prices.push( util.average(prices) );
    calcEMA('shortEMA');
    calcEMA('longEMA');

    // recurse if we don't have all candles
    if(current < config.candles)
      return getCandles(next);
    
    next();
  });
}

//    calculation (based on candle/day):
//  EMA = Price(t) * k + EMA(y) * (1 – k)
//  t = today, y = yesterday, N = number of days in EMA, k = 2/(N+1)
var calcEMA = function(type) {
  var k = 2 / (config[type] + 1);
  var ema, y, i = 0;

  var current = candles.prices.length;

  if(current === 1)
    // we don't have any 'yesterday'
    y = candles.prices[0];
  else
    y = candles[type + 's'][current - 1];

  ema = candles.prices[i] * k + y * (1 - k);
  candles[type + 's'].push(ema);
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