var BTCChina = require('btc-china-fork');
var util = require('../core/util.js');
var _ = require('lodash');
var moment = require('moment');
var log = require('../core/log');

var Trader = function(config) {
  _.bindAll(this);
  if(_.isObject(config)) {
    this.key = config.key;
    this.secret = config.secret;
    this.clientID = config.username;
  }
  this.name = 'BTCC';

  this.pair = (config.asset + config.currency).toUpperCase();

  this.btcc = new BTCChina(this.key, this.secret, this.clientID);
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

Trader.prototype.getTicker = function(callback) {
  var args = _.toArray(arguments);
  var process = function(err, result) {
    if(err)
      return this.retry(this.getTicker, args);

    callback(null, {
      bid: result.bids[0][0],
      ask: result.asks[0][0]
    });

  }.bind(this);

  this.btcc.getOrderBook(process, this.pair, 1);
}

Trader.prototype.getTrades = function(since, callback, descending) {
  var args = _.toArray(arguments);
  var process = function(err, result) {
    if(err)
      return this.retry(this.getTrades, args);

    if(descending)
      callback(null, result.reverse());
    else
      callback(null, result);
  }.bind(this);


  if(!since)
    since = 500;
  else
    since = 5000;

  this.btcc.getHistoryData(process, {limit: since});
}

Trader.prototype.getPortfolio = function(callback) {
  var args = _.toArray(arguments);
  var set = function(err, data) {
    if(err)
      return this.retry(this.getPortfolio, args);

    var portfolio = [];
    _.each(data.result.balance, function(obj) {
        portfolio.push({name: obj.currency, amount: parseFloat(obj.amount)});
    });
    callback(err, portfolio);
  }.bind(this);

  this.btcc.getAccountInfo(set, 'ALL');
}

Trader.prototype.getFee = function(callback) {
  var args = _.toArray(arguments);
  var set = function(err, data) {
    if(err)
      this.retry(this.getFee, args);

    callback(false, data.result.profile.trade_fee / 100);
  }.bind(this);

  this.btcc.getAccountInfo(set, 'ALL');
}

Trader.prototype.buy = function(amount, price, callback) {
  // TODO: do somewhere better..
  amount = Math.floor(amount * 10000) / 10000;

  var set = function(err, result) {
    if(err)
      return log.error('unable to buy:', err, result);

    callback(null, result.result);
  }.bind(this);

  this.btcc.createOrder2(set, 'buy', price, amount, this.pair);
}

Trader.prototype.sell = function(amount, price, callback) {
  // TODO: do somewhere better..
  amount = Math.round(amount * 10000) / 10000;

  var set = function(err, result) {
    if(err)
      return log.error('unable to sell:', err, result);

    callback(null, result.result);
  }.bind(this);

  this.btcc.createOrder2(set, 'sell', price, amount, this.pair);
}

Trader.prototype.checkOrder = function(order, callback) {
  var args = _.toArray(arguments);
  var check = function(err, result) {
    if(err)
      this.retry(this.checkOrder, args);

    var done = result.result.order.status === 'closed';
    callback(err, done);
  };

  this.btcc.getOrder(check, order, this.pair, true);
}

Trader.prototype.cancelOrder = function(order, callback) {
  var cancel = function(err, result) {
    if(err)
      log.error('unable to cancel order', order, '(', err, result, ')');
  }.bind(this);

  this.btcc.cancelOrder(cancel, order, this.pair);
}

Trader.getCapabilities = function () {
  return {
    name: 'BTCC',
    slug: 'btcc',
    currencies: ['BTC', 'CNY'],
    assets: ['BTC', 'LTC'],
    markets: [
      { pair: ['CNY', 'BTC'], minimalOrder: { amount: 0.001, unit: 'asset' } },
      { pair: ['CNY', 'LTC'], minimalOrder: { amount: 0.001, unit: 'asset' } },
      { pair: ['BTC', 'LTC'], minimalOrder: { amount: 0.001, unit: 'asset' } }
    ],
    requires: ['key', 'secret'],
    tid: 'tid',
    providesFullHistory: true,
  };
}

module.exports = Trader;