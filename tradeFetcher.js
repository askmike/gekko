var cexio = require('cexio');
var _ = require('lodash');
var moment = require('moment');
var utc = moment.utc;

var util = require('./util');
var config = util.getConfig();

var exchangeChecker = require('./exchangeChecker');

var provider = config.watch.exchange.toLowerCase();
if(provider === 'bitstamp') {
  // we can't fetch historical data from btce directly so we use bitcoincharts
  // @link http://bitcoincharts.com/about/markets-api/
  config.watch.market = provider;
  provider = 'bitcoincharts';
}

// console.log(provider);
var DataProvider = require('./exchanges/' + provider);



var Fetcher = function() {
  _.bindAll(this);

  // Create a public dataProvides object which can retrieve live 
  // trade information from an exchange.
  this.watcher = new DataProvider(config.watch);
  // console.log(config.watch);
  // return;

  this.exchange = exchangeChecker.settings(config.watch);

  // var BTCE = require('btc-e');
  // btcePublic = new BTCE();
  this.determineDynamicPollInterval();

  // if(!exchange.providesHistory)

  // btcePublic.trades('btc_usd', console.log);

  // we need to 
}

// we need to keep polling exchange because we cannot
// access older data. We need to calculate how often we
// we should poll:
// 
// 1. If the oldest trade in a fetch call > ema.interval
//   we can just use ema.interval.
// 2. If the oldest trade in a fetch call < ema.interval
//   we need to keep on dividing ema.interval (by 2,3,4,..)
//   until we that timeframe < the oldest fetch in a trade
//   call. Because a) we don't want to miss trades and b)
//   on interval we want fresh trades
Fetcher.prototype.determineDynamicPollInterval = function(cb) {
  var calculate = function(err, trades) {
    if(err)
      throw err;

    var first = _.first(trades).date;
    first = moment.unix(first);
    var last = _.last(trades).date;
    last = moment.unix(last);

    var fetchTimespan = util.calculateTimespan(first, last);
    var interval = util.minToMs(config.EMA.interval);
    
    // if we got the last 150 seconds of trades last
    // time make sure we fetch at least in 100 seconds
    // again
    var safeTreshold = 1.5;

    if(fetchTimespan / safeTreshold > interval) {
      // scenario 1.
      console.log('we can just fetch per interval');
    } else {
      // scenario 2.
      var time = interval, divides = 2;
      while(time > fetchTimespan / safeTreshold) {
        time = interval;
        time /= divides++;
      };

      console.log('we are going to fetch again in', time, 'for', divides, 'times');
      console.log('after', divides, 'fetches we propogate');
    }

  }
  this.watcher.getTrades(null, _.bind(calculate, this), true);
}



// Fetcher.prototype.setMidnight = function() {
//  this.midnight = utc().startOf('day');
// }

// Fetcher.prototype.minuteCount = function(timestamp) {
//  var timespan = utc(timestamp * 1000).diff(midnight);
//  var minutes = moment.duration(timespan).asMinutes();
//  return Math.floor(minutes);
// }

// Fetcher.prototype.getFetchTimespan = function() {

// }



// returns the minute number for this day
var minuteCount = function(timestamp) {
  
}


module.exports = Fetcher;