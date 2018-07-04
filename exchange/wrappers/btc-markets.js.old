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

    if(!_.isEmpty(data.errorMessage))
      return callback('BTC-MARKET API ERROR: ' + data.errorMessage);

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
  var args = _.toArray(arguments);
  var set = function(err, data) {

    if(!err && _.isEmpty(data))
      err = 'no data';
    else if(!err && !_.isEmpty(data.errorMessage))
      err = data.errorMessage;
    if(err){
      log.error('unable to retrieve fee', err, ' retrying...');
      return this.retry(this.getFee, args);
    }
    data.tradingFeeRate /= this.priceDivider;
    callback(false, data.tradingFeeRate);
  }.bind(this);
  this.btcmakets.getTradingFee(this.asset, this.currency, set);
}

Trader.prototype.buy = function(amount, price, callback) {

  price *= this.priceDivider;  
  amount = Math.floor(amount * this.priceDivider);
  var id = Math.random() + '';
  var set = function(err, data) {
    if(!err && _.isEmpty(data))
      err = 'no data';
    else if(!err && !_.isEmpty(data.errorMessage))
      err = data.errorMessage;
    if(err)
      return log.error('unable to buy', err);
    callback(null, data.id);
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
  var id = Math.random() + ''
  var set = function(err, data) {
    if(!err && _.isEmpty(data))
      err = 'no data';
    else if(!err && !_.isEmpty(data.errorMessage))
      err = data.errorMessage;
    if(err)
      return log.error('unable to sell', err)
    callback(null, data.id);
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
  var args = _.toArray(arguments);

  if (order == null) {
    return callback(null, true);
  }

  var check = function(err, data) {
    if(!err && _.isEmpty(data.orders))
      err = 'no data';
    else if(!err && !_.isEmpty(data.errorMessage))
      err = data.errorMessage;
    if(err){
      return log.error('unable to check order: ', order, '(', err ,'), retrying...');
       this.retry(this.checkOrder, args);
    }
    var placed = !_.isEmpty(data.orders)
    callback(err, !placed);
  }.bind(this);

  this.btcmakets.getOpenOrders(this.asset, this.currency, 10, null, check);
}

Trader.prototype.getOrder = function(order, callback) {
  var args = _.toArray(arguments);
  var get = function(err, data) {

    if(!err && _.isEmpty(data.orders))
      err = 'no data';
    else if(!err && !_.isEmpty(data.errorMessage))
      err = data.errorMessage;
    if(err){
      return log.error('unable to get order detail: ', order, '(', err ,'), retrying...');
      this.retry(this.getOrder, args);
    }
    var price = parseFloat(data.orders[0].price);
    var amount = parseFloat(data.orders[0].volumn);
    var date = moment.unix(data.orders[0].creationDate);

    callback(undefined, {price, amount, date});
  }.bind(this);

  this.btcmakets.getOrderDetail([order], callback);
}

Trader.prototype.cancelOrder = function(order, callback) {
  var args = _.toArray(arguments);
  var get = function(err, data) {

    if(!err && _.isEmpty(data))
      err = 'no data';
    else if(!err && !_.isEmpty(data.errorMessage))
      err = data.errorMessage;
    if(err){
       return log.error('unable to cancel order: ',order, '(', err, '), retrying...');
       this.retry(this.cancelOrder, args);
    }
    callback();
  };
  this.btcmakets.cancelOrders([order], callback);
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
      'BTC', 'LTC', 'ETH', 'ETC', 'BCH', 'XRP'
    ],
    markets: [
      { pair: ['AUD', 'BTC'], minimalOrder: { amount: 0.001, unit: 'asset' } },
      { pair: ['AUD', 'LTC'], minimalOrder: { amount: 0.001, unit: 'asset' } },
      { pair: ['AUD', 'ETH'], minimalOrder: { amount: 0.001, unit: 'asset' } },
      { pair: ['AUD', 'ETC'], minimalOrder: { amount: 0.001, unit: 'asset' } },
      { pair: ['AUD', 'BCH'], minimalOrder: { amount: 0.001, unit: 'asset' } },
      { pair: ['AUD', 'XRP'], minimalOrder: { amount: 0.001, unit: 'asset' } },
      { pair: ['BTC', 'LTC'], minimalOrder: { amount: 0.001, unit: 'asset' } },
      { pair: ['BTC', 'ETH'], minimalOrder: { amount: 0.001, unit: 'asset' } },
      { pair: ['BTC', 'ETC'], minimalOrder: { amount: 0.001, unit: 'asset' } },
      { pair: ['BTC', 'BCH'], minimalOrder: { amount: 0.001, unit: 'asset' } },
      { pair: ['BTC', 'XRP'], minimalOrder: { amount: 0.001, unit: 'asset' } }
    ],
    requires: ['key', 'secret'],
    tid: 'tid',
    providesHistory: 'scan',
    providesFullHistory: false,
    tradable: true
  };
}

module.exports = Trader;
