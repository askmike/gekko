var BitcoinCharts = require('bitcoincharts');
var util = require('../util.js');
var moment = require('moment');
var _ = require('lodash');
var log = require('../log.js');

var Watcher = function(config) {
  if(_.isObject(config))
    this.symbol = config.market + config.currency;

  this.name = 'bitcoincharts';

  _.bindAll(this);

  this.bitcoinCharts = new BitcoinCharts();
}

Watcher.prototype.getTrades = function(since, callback, descending) {
  var params = { symbol: this.symbol };
  if(since)
    // we don't want to hammer bitcoincharts,
    // this will fetch trades between start and now
    params.start = since.format('X');
  // otherwise fetch trades within the last interval
  else 
    params.start = util.intervalsAgo(1).format('X');

  var args = _.toArray(arguments);
  this.bitcoinCharts.trades(params, _.bind(function(err, data) {
    if(err)
      return this.retry(this.getTrades, args);

    if(!data || !data.length)
      return this.retry(this.getTrades, args);

    // normalize the data
    var trades = [];
    _.each(data, function(array) {
      trades.push({
        date: array[0],
        price: array[1],
        amount: array[2]
      });
    });

    if(descending)
      callback(trades.reverse());
    else
      callback(trades);
  }, this));
}

// if the exchange errors we try the same call again after
// waiting 10 seconds
Watcher.prototype.retry = function(method, args) {
  var wait = +moment.duration(10, 'seconds');
  log.debug(this.name, 'returned an error, retrying..');

  var self = this;

  // make sure the callback (and any other fn)
  // is bound to Trader
  _.each(args, function(arg, i) {
    if(_.isFunction(arg))
      args[i] = _.bind(arg, self);
  });

  // run the failed method again with the same
  // arguments after wait
  setTimeout(
    function() { method.apply(self, args) },
    wait
  );
}

module.exports = Watcher;
