var BitcoinCharts = require('bitcoincharts');
var util = require('../util.js');
var moment = require('moment');
var _ = require('underscore');

var watcher = function(market, currency, config) {
  this.symbol = market + currency;
  this.name = 'bitcoincharts';
  this.config = config;

  _.bindAll(this);

  this.bitcoinCharts = new BitcoinCharts();
}

watcher.prototype.getTrades = function(since, callback) {
  var params = { symbol: this.symbol };
  if(since)
    // we don't want to hammer bitcoincharts,
    // this will fetch trades between start and now
    params.start = since.format('X');
  
  this.bitcoinCharts.trades(params, function(err, data) {
    if(err) throw err;

    // normalize the data
    var trades = [];
    _.each(data, function(array) {
      trades.push({
        date: array[0],
        price: array[1],
        amount: array[2]
      });
    });

    callback(false, { data: trades.reverse() });
  });
}

module.exports = watcher;