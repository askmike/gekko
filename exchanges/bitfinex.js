
var Bitfinex = require("bitfinex");
var util = require('../core/util.js');
var _ = require('lodash');
var moment = require('moment');
var log = require('../core/log');

// Module-wide constants
var exchangeName = 'bitfinex';
// Bitfinex supports Litecoin, but this module currently only supports Bitcoin
var defaultAsset = 'btcusd';

var Trader = function(config) {
  _.bindAll(this);
  if(_.isObject(config)) {
    this.key = config.key;
    this.secret = config.secret;
  }
  this.name = 'Bitfinex';
  this.balance;
  this.price;

  this.bitfinex = new Bitfinex(this.key, this.secret);
}

// if the exchange errors we try the same call again after
// waiting 10 seconds
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

Trader.prototype.getPortfolio = function(callback) {
  this.bitfinex.wallet_balances(function (err, data, body) {
    var portfolio = _.map(data, function (asset) {
      return {
        name: asset.currency.toUpperCase(),
        // TODO: use .amount instead of .available?
        amount: +asset.available
      }
    });
    callback(err, portfolio);
  });
}

Trader.prototype.getTicker = function(callback) {
  this.bitfinex.ticker(defaultAsset, function (err, data, body) {
    var tick = JSON.parse(body);
    callback(err, { bid: +tick.bid, ask: +tick.ask })
  });
}

// This assumes that only limit orders are being placed, so fees are the
// "maker fee" of 0.1%.  It does not take into account volume discounts.
Trader.prototype.getFee = function(callback) {
    var makerFee = 0.1;
    callback(false, makerFee / 100);
}

function submit_order(bfx, type, amount, price, callback) {
  // TODO: Bitstamp module included the following - is it necessary?
  // amount *= 0.995; // remove fees
  amount = Math.floor(amount*100000000)/100000000;
  bfx.new_order(defaultAsset, amount, price, exchangeName, 
    type, 
    'exchange limit', 
    function (err, data, body) {
      if (err)
        return log.error('unable to ' + type, err, body);

      var order = JSON.parse(body);
      callback(err, order.order_id);
    });
}

Trader.prototype.buy = function(amount, price, callback) {
  submit_order(this.bitfinex, 'buy', amount, price, callback);

}

Trader.prototype.sell = function(amount, price, callback) {
  submit_order(this.bitfinex, 'sell', amount, price, callback);
}

Trader.prototype.checkOrder = function(order_id, callback) {
  this.bitfinex.order_status(order_id, function (err, data, body) {
      var result = JSON.parse(body);
      callback(err, result.is_live);    
  });
}

Trader.prototype.cancelOrder = function(order_id, callback) {
  this.bitfinex.cancel_order(order_id, function (err, data, body) {
      var result = JSON.parse(body);
      if (err || !result || !result.is_cancelled)
        log.error('unable to cancel order', order, '(', err, result, ')');
  });
}

Trader.prototype.getTrades = function(since, callback, descending) {
  var args = _.toArray(arguments);
  var self = this;

  // Bitfinex API module does not support start date, but Bitfinex API does. 
  var start = since ? since.unix() : null;
  this.bitfinex.trades(defaultAsset, start, function (err, data) {
    if (err)
      return self.retry(self.getTrades, args);

    var trades = _.map(data, function (trade) {
      return {
        date:  trade.timestamp,
        price: +trade.price,
        amount: +trade.amount // not mentioned in gekko exchange docs [@TODO mike]
      }
    });

    callback(null, descending ? trades : trades.reverse());
  });
}

module.exports = Trader;

