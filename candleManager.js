
// - Feeding candles to a trading method

var _ = require('lodash');
// var moment = require('moment');
// var utc = moment.utc;
var log = require('./log.js');

var util = require('./util');
var config = util.getConfig();




var Manager = function() {
  _.bindAll(this);

  // if(!config.backtest.enabled)
  //   this.watchMarket();
  // else
  //   console.log('WUP WUP this.backtest();');

  this.model = require('./databaseManager');

  // this.checkHistory();
}

Manager.prototype.watchMarket = function() {
  var TradeFetcher = require('./tradeFetcher');
  this.fetcher = new TradeFetcher;

  this.fetcher.on('new trades', this.processTrades);
}



// Manager.prototype.candleExists = function() {

// }

Manager.prototype.processTrades = function(data) {
  console.log('NEW TRADES YOLO');
}


// var a = new Manager;
module.exports = Manager;



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
// var minuteCount = function(timestamp) {
  
// }