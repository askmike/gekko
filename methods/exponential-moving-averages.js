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
  var since = util.toMicro(util.intervalsAgo( current ));

  mtgox.fetchTrades(since, function(err, trades) {
    if (err) throw err;

    // out of all 1000 trades create a sample of [trades per price] trades
    sample = _.map(trades.data.slice(0, config.tradesPerPrice), function(trade) {
      return parseFloat(trade.price);
    });

    candles.prices.push( util.average(sample) );
    calcEMA('shortEMA');
    calcEMA('longEMA');

    // recurse if we don't have all candles
    if(current < config.candles)
      return getCandles(cb);
    
    next();
  });
}

var calcEMA = function(type) {
  //    calculation (based on candle/day):
  //  EMA = Price(t) * k + EMA(y) * (1 – k)
  //  t = today, y = yesterday, N = number of days in EMA, k = 2/(N+1)
  var k = 2 / (config[type] + 1);
  var emas = [], i = 0, ema, y;

  var current = candles.prices.length;

  if(current === 1)
    // we don't have any 'yesterday'
    y = candles.prices[0];
  else
    y = candles[type + 's'][current];

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