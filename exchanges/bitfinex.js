
var Bitfinex = require("bitfinex-api-node");
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
  this.bitfinex.rest.wallet_balances(function (err, data, body) {
    var portfolio = _(data).filter(function(data) {
      return data.type === 'exchange';
    }).map(function (asset) {
      return {
        name: asset.currency.toUpperCase(),
        // TODO: use .amount instead of .available?
        amount: +asset.available
      }
    }).value();
    callback(err, portfolio);
  });
}

Trader.prototype.getTicker = function(callback) {
  this.bitfinex.rest.ticker(defaultAsset, function (err, data, body) {
    callback(err, { bid: +data.bid, ask: +data.ask })
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

  bfx.new_order(defaultAsset, amount + '', price + '', exchangeName,
    type,
    'exchange limit',
    function (err, data, body) {
      if (err)
        return log.error('unable to ' + type, err, body);

      callback(err, data.order_id);
    });
}

Trader.prototype.buy = function(amount, price, callback) {
  submit_order(this.bitfinex.rest, 'buy', amount, price, callback);

}

Trader.prototype.sell = function(amount, price, callback) {
  submit_order(this.bitfinex.rest, 'sell', amount, price, callback);
}

Trader.prototype.checkOrder = function(order_id, callback) {
  this.bitfinex.rest.order_status(order_id, function (err, data, body) {
    callback(err, !data.is_live);
  });
}

Trader.prototype.cancelOrder = function(order_id, callback) {
  this.bitfinex.rest.cancel_order(order_id, function (err, data, body) {
      if (err || !data || !data.is_cancelled)
        log.error('unable to cancel order', order_id, '(', err, data, ')');
  });
}

Trader.prototype.getTrades = function(since, callback, descending) {
  var args = _.toArray(arguments);
  var self = this;
  var limit_trades = '?limit_trades=10000';

  this.bitfinex.rest.trades(defaultAsset + limit_trades,  function (err, data) {
    if (err)
      return self.retry(self.getTrades, args);

    var trades = _.map(data, function (trade) {
      return {
        tid: trade.tid,
        date:  trade.timestamp,
        price: +trade.price,
        amount: +trade.amount
      }
    });

    callback(null, descending ? trades : trades.reverse());
  });
}

module.exports = Trader;
