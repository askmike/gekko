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

var getPrice = function(i, cb) {
  if(typeof i === 'function')
    cb = i, i = 1;

  var current = config.candles + 1 - i;
  var since = util.toMicro(util.intervalsAgo( current ));

  mtgox.fetchTrades(since, function(err, trades) {
    if (err) throw err;

    // out of all 1000 trades create a sample of [trades per price] trades
    sample = _.map(trades.data.slice(0, config.tradesPerPrice), function(trade) {
      return parseFloat(trade.price);
    });

    candles.prices.push( util.average(sample) );

    // recurse without hammering mtgox (to hard)
    if(i < config.candles)
      return setTimeout(getPrice, 150, ++i, cb);
    
    // done with fetching all prices
    cb();
  });
}

var calcEMA = function(period) {
  //    calculation:
  //  EMA = Price(t) * k + EMA(y) * (1 – k)
  //  t = today, y = yesterday, N = number of days in EMA, k = 2/(N+1)
  var k = 2 / (period + 1);
  var emas = [], i = 0, ema;
  var y = candles.prices[ i ];
  // first candle
  emas.push( y );
  while(++i < config.candles) {
    ema = candles.prices[i] * k + y * ( 1 - k);
    emas.push( ema );
    y = ema;
  }

  return emas;
}

var calc = function() {
  candles.shortEMAs = calcEMA(config.shortEMA);
  candles.longEMAs = calcEMA(config.longEMA);

  console.log('long', config.longEMA, candles.longEMAs);
  console.log('short', config.shortEMA, candles.shortEMAs);
  console.log('price', candles.prices);
}

var init = function(c, m) {
  config = c;
  mtgox = m;
  util.set(c);

  // fetch all prices and calculate when done
  getPrice(calc);
}

module.exports.on('init', init);