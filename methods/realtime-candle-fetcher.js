// 
//  This is an abstract constructor function that has all methods needed to query
//  raw trade information from exchanges (through objects described in `/exchanges`)
//  and convert them into candles.
// 
//  Trade methods can extend this constructor to 
// 


var moment = require('moment');
var _ = require('underscore');
var util = require('../util.js');
var Util = require('util');
var log = require('../log.js');
var EventEmitter = require('events').EventEmitter;

// `abstract` constructor
var CandleCalculator = function() {}

Util.inherits(CandleCalculator, EventEmitter);

// Prepares the candle fetcher and instantiates some objects
// to keep track of what has been fetched.
CandleCalculator.prototype.set = function() {
  this.interval = this.settings.interval;
  this.candles = this.settings.candles;
  this.currentBucket = this.candles - 2;
  var list = _.range(this.candles - 1);
  // buckets store all trades ordered per candle _chronologically reversed_ 
  this.buckets = _.map(list, function() { return [] });
  // candles are stored _chronologically_ (first is old, last is new)
  this.candles = {
    open: [],
    high: [],
    low: [],
    close: []
  }

  this.emit('prepared');
}

// calculate [amount] of historical candles based on trades provided by the watcher
// 
// This is done by fetching all trades and bucketing all trades in the appropiate
// trade buckets (each candle corresponds to one bucket) and calculating the candle (OHCL)
// for each bucket.
CandleCalculator.prototype.getHistoricalCandles = function() {
  log.debug('fetching historical data at', this.watcher.name);
  this.fetchingHistorical = true;
  var candleStartTime = util.intervalsAgo(this.currentBucket + 2);
  this.watcher.getTrades(candleStartTime, this.fillBuckets);
}

// fill buckets based on the trade data.
CandleCalculator.prototype.fillBuckets = function(trades) {
  var latestTradeDate;
  var startBucket = this.currentBucket;

  var emptyBucket = true;
  var nextBucketTime = util.intervalsAgo(this.currentBucket);
  _.every(trades, function(trade) {
    var time = moment.unix(trade.date);
    // as long as this trade is to recent
    // it should go to the next bucket
    while(time > nextBucketTime) {
      if(emptyBucket === true)
        return false;

      // we can calculate the candle of the freshly filled bucket
      this.calculateCandle();

      this.currentBucket--;

      // if we have to fill the most recent bucket we just use 
      // the fillNewBucket method
      if(this.currentBucket === 0) {
        this.getNewCandle();
        return false;
      }

      nextBucketTime = util.intervalsAgo(this.currentBucket);
    }

    emptyBucket = false;
    latestTradeDate = time;
    this.buckets[ this.currentBucket ].push(parseFloat(trade.price));

    return true;
  }, this);

  // we're done if we stuffed all trades in
  // all buckets except for the most recent one
  if(this.currentBucket < 1)
    return;

  // if we haven't got a single useful trade bail out
  if(!latestTradeDate)
    throw 'Failed to load historical trades from ' + this.watcher.name;

  log.debug('need new trades, refetching', this.watcher.name);

  // if we did not got enough trades to fill a single bucket
  // we ask as for new trades from the last point
  if(startBucket === this.currentBucket)
    return this.watcher.getTrades(latestTradeDate.add('s', 1), this.fillBuckets);

  var candleStartTime = util.intervalsAgo(this.currentBucket + 1);
  this.watcher.getTrades(candleStartTime, this.fillBuckets);
}

// this method fetches most recent trades and calculates a new candle based on the trades
CandleCalculator.prototype.getNewCandle = function() {

  if(this.fetchingHistorical)
    // we just fetched all historical buckets
    this.fetchingHistorical = false;
  else
    this.removeOldestBucket();

  this.removeOldestCandle();
  
  log.debug('fetching new trades for new bucket at', this.watcher.name);
  this.watcher.getTrades(false, this.fillNewBucket, true);
}

CandleCalculator.prototype.removeOldestBucket = function() {
  // buckets are stored reversed chronologically
  this.buckets.pop();
}

CandleCalculator.prototype.removeOldestCandle = function() {
  // candles are stored chronologically
  this.candles.open.shift();
  this.candles.high.shift();
  this.candles.low.shift();
  this.candles.close.shift();
}

CandleCalculator.prototype.fillNewBucket = function(trades) {
  var candleStartTime = util.intervalsAgo(1);

  this.buckets.splice(0, 0, []);

  // for as long as trades fit into the new bucket
  // put them in.
  _.every(trades, function(trade) {
    var time = moment.unix(trade.date);
    if(time < candleStartTime)
      // this trade belongs to the previous bucket
      // skip everything from here on
      return false;

    this.buckets[0].push(parseFloat(trade.price));
    return true;
  }, this);

  if(!this.buckets[0].length) {
    // none of the recieved trades were after the previous candle
    log.debug('did not receive trades for most recent candle, retrying..');
    return setTimeout(this.getNewCandle, +moment.duration(10, 'seconds'));
  }

  this.calculateCandle();
}

CandleCalculator.prototype.calculateCandle = function() {
  var bucket = this.buckets[this.currentBucket];
  // because buckets (and their contents) are chronologically reversed 
  // the _last_ item is the open and the _first_ is the close
  this.candles.open.push(_.last(bucket));
  this.candles.high.push(_.max(bucket));
  this.candles.low.push(_.min(bucket));
  this.candles.close.push(_.first(bucket));

  log.debug('calculated candle:', this.currentBucket);

  this.emit('calculated candle');

  if(this.currentBucket === 0)
    this.emit('calculated new candle');
}

module.exports = CandleCalculator;