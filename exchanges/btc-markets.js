var BTCMarkets = require('btc-markets');
var _ = require('lodash');
var moment = require('moment');
var log = require('../core/log');

var Trader = function(config) {
  _.bindAll(this);
  if(_.isObject(config)) {
    this.key = config.key;
    this.secret = config.secret;
    this.clientID = config.username;
    this.currency = config.currency;
    this.asset = config.asset;
  }
  this.name = 'BTC Markets';
  this.priceDivider = 100000000; // one hundred million

  this.btcmakets = new BTCMarkets(this.key, this.secret);
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
  var set = function(err, data) {

    if(!_.isEmpty(data.error))
      return callback('BTC-MARKET API ERROR: ' + data.error);

    var portfolio = _.map(data, function(balance) {
      return {
        name: balance.currency,
        amount: balance.balance / this.priceDivider
      }
    }, this);

    callback(err, portfolio);
  }.bind(this);

  this.btcmakets.getAccountBalances(set);
}

Trader.prototype.getTicker = function(callback) {
  var args = _.toArray(arguments);
  var set = function(err, result) {
    if(err)
      return this.retry(this.getTicker, args);

    callback(null, {
      bid: result.bestBid,
      ask: result.bestAsk
    });
  }.bind(this);
  this.btcmakets.getTick(this.asset, this.currency, set);
}

Trader.prototype.getFee = function(callback) {
  // TODO, not 100% correct.
  // However there is no API call to retrieve real fee
  callback(false, 0.00085)
}

Trader.prototype.buy = function(amount, price, callback) {
  var invFee = 0.9915;
  price *= this.priceDivider;
  amount = Math.floor(amount * this.priceDivider * invFee);
  var id = Math.random() + '';

  var set = function(err, result) {
    if(err || result.error)
      return log.error('unable to buy:', err, result);

    callback(null, id);
  }.bind(this);

  this.btcmakets.createOrder(
    this.asset,
    this.currency,
    price,
    amount,
    'Bid',
    'Limit',
    id,
    set
  );
}

Trader.prototype.sell = function(amount, price, callback) {
  price *= this.priceDivider;
  amount = Math.floor(amount * this.priceDivider);
  var id = Math.random() + '';

  var set = function(err, result) {
    if(err || result.error)
      return log.error('unable to buy:', err, result);

    callback(null, id);
  }.bind(this);

  this.btcmakets.createOrder(
    this.asset,
    this.currency,
    price,
    amount,
    'Ask',
    'Limit',
    id,
    set
  );
}

Trader.prototype.checkOrder = function(order, callback) {
  var check = function(err, result) {
    callback(err, result && result.success);
  }.bind(this);

  this.btcmakets.getOpenOrders(this.asset, this.currency, 10, null, check);
}

Trader.prototype.cancelOrder = function(order, callback) {
  var cancel = function(err, result) {
    if(err || !result)
      log.error('unable to cancel order', order, '(', err, result, ')');
  }.bind(this);

  this.btcmakets.cancelOrder([order], cancel);
}

Trader.prototype.getTrades = function(since, callback, descending) {
  var args = _.toArray(arguments);
  var process = function(err, result) {
    if(err)
      return this.retry(this.getTrades, args);

    callback(null, result.reverse());
  }.bind(this);

  // supports `since` based on trade ID, Gekko can't work this atm..
  this.btcmakets.getTrades(this.asset, this.currency, process);
}

Trader.getCapabilities = function () {
  return {
    name: 'BTC Markets',
    slug: 'btc-markets',
    currencies: ['AUD', 'BTC'],
    assets: [
      'BTC', 'LTC', 'ETH', 'ETC'
    ],
    markets: [
      { pair: ['AUD', 'BTC'], minimalOrder: { amount: 0.001, unit: 'asset' } },
      { pair: ['AUD', 'LTC'], minimalOrder: { amount: 0.001, unit: 'asset' } },
      { pair: ['AUD', 'ETH'], minimalOrder: { amount: 0.001, unit: 'asset' } },
      { pair: ['AUD', 'LTC'], minimalOrder: { amount: 0.001, unit: 'asset' } },
      { pair: ['BTC', 'LTC'], minimalOrder: { amount: 0.001, unit: 'asset' } },
      { pair: ['BTC', 'ETH'], minimalOrder: { amount: 0.001, unit: 'asset' } },
      { pair: ['BTC', 'ETC'], minimalOrder: { amount: 0.001, unit: 'asset' } }
    ],
    requires: ['key', 'secret'],
    providesHistory: false,
    tid: 'tid'
  };
}

module.exports = Trader;
