var BitX = require("bitx")
var util = require('../core/util.js');
var _ = require('lodash');
var moment = require('moment');
var log = require('../core/log');

var Trader = function(config) {
  _.bindAll(this);
  if(_.isObject(config)) {
    this.key = config.key;
    this.secret = config.secret;
  }
  this.name = 'BitX';
  this.pair = config.asset + config.currency;
  this.bitx = new BitX(this.key, this.secret, { pair: this.pair });

}

Trader.prototype.retry = function(method, args) {
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

Trader.prototype.getTrades = function(since, callback, descending) {
  var args = _.toArray(arguments);
  var process = function(err, result) {
    if(err)
      return this.retry(this.getTrades, args);

    trades = _.map(result.trades, function (t) {
      return {
        price: t.price,
        date: Math.round(t.timestamp / 1000),
        amount: t.volume,
        msdate: t.timestamp // we use this as tid
      };
    });

    // Decending by default
    if (!descending) {
      trades = trades.reverse()
    }

    callback(null, trades);
  }.bind(this);

  this.bitx.getTrades(process);
}


Trader.prototype.buy = function(amount, price, callback) {

}

Trader.prototype.sell = function(amount, price, callback) {

}

Trader.prototype.getPortfolio = function(callback) {

}

Trader.prototype.getTicker = function(callback) {

}

Trader.prototype.getFee = function(callback) {

}

Trader.prototype.checkOrder = function(order, callback) {

}

Trader.prototype.cancelOrder = function(order) {

}

Trader.getCapabilities = function () {
  return {
    name: 'BitX',
    slug: 'bitx',
    currencies: ['MYR', 'KES', 'NGN', 'ZAR'],
    assets: ['XBT'],
    markets: [
      { pair: ['MYR', 'XBT'], minimalOrder: { amount: 0.00001, unit: 'asset' } },
      { pair: ['KES', 'XBT'], minimalOrder: { amount: 0.00001, unit: 'asset' } },
      { pair: ['NGN', 'XBT'], minimalOrder: { amount: 0.00001, unit: 'asset' } },
      { pair: ['ZAR', 'XBT'], minimalOrder: { amount: 0.00001, unit: 'asset' } }
    ],
    requires: ['key', 'secret'],
    providesHistory: false,
    tid: 'msdate'
  };
}

module.exports = Trader;
