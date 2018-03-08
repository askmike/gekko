var Coingi = require('coingi');
var moment = require('moment');
var _ = require('lodash');

var util = require('../core/util');
var Errors = require('../core/error');
var log = require('../core/log');


var Trader = function (config) {
  _.bindAll(this);

  if (_.isObject(config)) {
    this.key = config.key;
    this.secret = config.secret;
    this.currency = config.currency.toUpperCase()
    this.asset = config.asset.toUpperCase();
  }

  this.pair = this.asset + "-" + this.currency;
  this.name = 'coingi';
  this.since = null;

  this.coingi = new Coingi(
    this.key,
    this.secret,
    {timeout: +moment.duration(60, 'seconds')}
  );
}

var retryCritical = {
  retries: 10,
  factor: 1.2,
  minTimeout: 1 * 1000,
  maxTimeout: 30 * 1000
};

var retryForever = {
  forever: true,
  factor: 1.2,
  minTimeout: 10,
  maxTimeout: 30
};

var recoverableErrors = new RegExp(/(SOCKETTIMEDOUT|TIMEDOUT|CONNRESET|CONNREFUSED|NOTFOUND|API:Invalid nonce|Service:Unavailable|Request timed out|Response code 520|Response code 504|Response code 502)/)

Trader.prototype.processError = function (funcName, error) {
  if (!error)
    return undefined;

  if (!error.message.match(recoverableErrors)) {
    log.error(`[coingi.js] (${funcName}) returned an irrecoverable error: ${error.message}`);
    return new Errors.AbortError('[coingi.js] ' + error.message);
  }

  log.debug(`[coingi.js] (${funcName}) returned an error, retrying: ${error.message}`);
  return new Errors.RetryError('[coingi.js] ' + error.message);
};

Trader.prototype.handleResponse = function (funcName, callback) {
  return (error, body) => {
    if (!error) {
      if (_.isEmpty(body))
        error = new Error('NO DATA WAS RETURNED');

      else if (!_.isEmpty(body.error))
        error = new Error(body.error);
    }

    return callback(this.processError(funcName, error), body);
  }
};




/* PORTFOLIO MANAGER */

Trader.prototype.getTicker = function (callback) {
  var setTicker = function (err, data) {
    if (err)
      return callback(err);

    var ticker = {
      ask: data.asks[0].price,
      bid: data.bids[0].price
    };
    callback(undefined, ticker);
  };

  let handler = (cb) => this.coingi.api('order-book', "/" + this.pair + "/1/1/1", this.handleResponse('getTicker', cb));
  util.retryCustom(retryForever, _.bind(handler, this), _.bind(setTicker, this));
};


Trader.prototype.getTrades = function (since, callback, ascending) {
  var startTs = since ? moment(since).valueOf() : null;

  var processResults = function (err, trades) {
    if (err) {
      return callback(err);
    }

    var parsedTrades = [];
    _.each(trades, function (trade) {
      // Even when you supply 'since' you can still get more trades than you asked for, it needs to be filtered
      if (_.isNull(startTs) || startTs < moment(trade.timestamp).valueOf()) {
        parsedTrades.push({
          type: trade.type === 0 ? "sell" : "buy",
          date: moment(trade.timestamp).unix(),
          amount: String(trade.amount),
          price: String(trade.price),
          tid: trade.timestamp
        });
      }
    }, this);

    if(ascending)
      callback(undefined, parsedTrades);
    else
      callback(undefined, parsedTrades.reverse());
  };

  var optionalSince = "";
  if (since) {
    optionalSince = "/" + startTs;
  }

  let handler = (cb) => this.coingi.api('transactions', "/" + this.pair + "/512" + optionalSince, this.handleResponse('getTrades', cb));
  util.retryCustom(retryForever, _.bind(handler, this), _.bind(processResults, this));
};

Trader.prototype.getPortfolio = function (callback) {
  var setBalance = function (err, data) {
    if (err)
      return callback(err);

    log.debug('[coingi.js] entering "setBalance" callback after coingi-api call, data:', data);

    const portfolio = [];
    for (var i = 0; i < data.length; i++) {
      portfolio.push({
        name: data[i].currency.name.toUpperCase(),
        amount: data[i].available
      });
    }

    return callback(undefined, portfolio);
  };

  let handler = (cb) => this.coingi.api('balance', {currencies: this.asset + "," + this.currency}, this.handleResponse('getPortfolio', cb));
  util.retryCustom(retryForever, _.bind(handler, this), _.bind(setBalance, this));
};

// Base fee is 0.2%
Trader.prototype.getFee = function (callback) {
  const fee = 0.2;
  callback(undefined, fee / 100);
};

Trader.prototype.addOrder = function (tradeType, amount, price, callback) {
  log.debug('[coingi.js] (add-order)', tradeType.toUpperCase(), amount, this.asset, '@', price, this.currency);

  var setOrder = function (err, data) {
    if (err)
      return callback(err);

    var uuid = data.result;
    log.debug('[coingi.js] (addOrder) added order with uuid:', uuid);

    callback(undefined, uuid);
  };

  let reqData = {
    currencyPair: this.pair,
    type: tradeType.toLowerCase() === "sell" ? 0 : 1,
    price: price,
    volume: amount.toString()
  };

  let handler = (cb) => this.coingi.api('add-order', reqData, this.handleResponse('addOrder', cb));
  util.retryCustom(retryCritical, _.bind(handler, this), _.bind(setOrder, this));
};


Trader.prototype.getOrder = function (orderId, callback) {
  var getOrder = function (err, order) {
    if (err)
      return callback(err);

    if (order !== null) {
      const price = parseFloat(order.price);
      const amount = parseFloat(order.baseAmount);
      const date = moment.unix(order.timestamp);
      callback(undefined, {price, amount, date});
    } else {
      log.error("Error! Order ID '" + orderId + "' couldn't be found in the result of get order!");
    }
  };

  let reqData = {ordeId: orderId};
  let handler = (cb) => this.coingi.api('get-order', reqData, this.handleResponse('getOrder', cb));
  util.retryCustom(retryCritical, _.bind(handler, this), _.bind(getOrder, this));
}

Trader.prototype.buy = function (amount, price, callback) {
  this.addOrder('buy', amount, price, callback);
};

Trader.prototype.sell = function (amount, price, callback) {
  this.addOrder('sell', amount, price, callback);
};

Trader.prototype.checkOrder = function (orderId, callback) {
  var check = function (err, order) {
    if (err)
      return callback(err);

    if (order === null) {
      log.error("Error! Order ID '" + orderId + "' couldn't be found in the result of get order!");
    }
    // returns true when the order has been filled (processed in full), false otherwise
    callback(undefined, order !== null && order.status === 2);
  };

  let reqData = {orderId: orderId};
  let handler = (cb) => this.coingi.api('get-order', reqData, this.handleResponse('checkOrder', cb));
  util.retryCustom(retryCritical, _.bind(handler, this), _.bind(check, this));
};

Trader.prototype.cancelOrder = function (order, callback) {
  let reqData = {orderId: order};
  let handler = (cb) => this.coingi.api('cancel-order', reqData, this.handleResponse('cancelOrder', cb));
  util.retryCustom(retryForever, _.bind(handler, this), callback);
};

Trader.getCapabilities = function () {
  return {
    name: 'Coingi',
    slug: 'coingi',
    currencies: ['EUR', 'USD', 'BTC'],
    assets: ['BTC', 'DASH', 'DOGE', 'EUR', 'LTC', 'NMC', 'PPC', 'VTC'],
    markets: [
      // Tradeable against BTC
      {pair: ['USD', 'BTC'], minimalOrder: {amount: 0.00001, unit: 'asset'}, precision: 8},
      {pair: ['EUR', 'BTC'], minimalOrder: {amount: 0.00001, unit: 'asset'}, precision: 8},

      // Tradeable against DASH
      {pair: ['BTC', 'DASH'], minimalOrder: {amount: 0.00001, unit: 'asset'}, precision: 8},

      // Tradeable against DOGE
      {pair: ['BTC', 'DOGE'], minimalOrder: {amount: 0.00001, unit: 'asset'}, precision: 8},
      {pair: ['USD', 'DOGE'], minimalOrder: {amount: 0.00001, unit: 'asset'}, precision: 8},

      // Tradeable against EUR
      {pair: ['USD', 'EUR'], minimalOrder: {amount: 0.01, unit: 'asset'}, precision: 2},

      // Tradeable against LTC
      {pair: ['BTC', 'LTC'], minimalOrder: {amount: 0.00001, unit: 'asset'}, precision: 8},
      {pair: ['EUR', 'LTC'], minimalOrder: {amount: 0.00001, unit: 'asset'}, precision: 8},
      {pair: ['USD', 'LTC'], minimalOrder: {amount: 0.00001, unit: 'asset'}, precision: 8},

      // Tradeable against NMC
      {pair: ['BTC', 'NMC'], minimalOrder: {amount: 0.00001, unit: 'asset'}, precision: 8},

      // Tradeable against PPC
      {pair: ['USD', 'PPC'], minimalOrder: {amount: 0.00001, unit: 'asset'}, precision: 8},
      {pair: ['EUR', 'PPC'], minimalOrder: {amount: 0.00001, unit: 'asset'}, precision: 8},
      {pair: ['BTC', 'PPC'], minimalOrder: {amount: 0.00001, unit: 'asset'}, precision: 8},

      // Tradeable against VTC
      {pair: ['BTC', 'VTC'], minimalOrder: {amount: 0.00001, unit: 'asset'}, precision: 8}
    ],
    requires: ['key', 'secret'],
    providesHistory: 'date',
    providesFullHistory: true,
    exchangeMaxHistoryAge: 30,
    tid: 'date',
    tradable: true
  };
}

module.exports = Trader;
