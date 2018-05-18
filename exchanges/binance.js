const moment = require('moment');
const _ = require('lodash');

const util = require('../core/util');
const Errors = require('../core/error');
const log = require('../core/log');
const marketData = require('./binance-markets.json');

const Binance = require('binance');

var Trader = function(config) {
  _.bindAll(this);

  if (_.isObject(config)) {
    this.key = config.key;
    this.secret = config.secret;
    this.currency = config.currency.toUpperCase();
    this.asset = config.asset.toUpperCase();
  }

  this.pair = this.asset + this.currency;
  this.name = 'binance';

  this.market = _.find(Trader.getCapabilities().markets, (market) => {
    return market.pair[0] === this.currency && market.pair[1] === this.asset
  });

  this.binance = new Binance.BinanceRest({
    key: this.key,
    secret: this.secret,
    timeout: 15000,
    recvWindow: 60000, // suggested by binance
    disableBeautification: false,
    handleDrift: true,
  });
};

var retryCritical = {
  retries: 10,
  factor: 1.2,
  minTimeout: 1 * 1000,
  maxTimeout: 30 * 1000
};

var retryForever = {
  forever: true,
  factor: 1.2,
  minTimeout: 10 * 1000,
  maxTimeout: 30 * 1000
};

var recoverableErrors = new RegExp(/(SOCKETTIMEDOUT|TIMEDOUT|CONNRESET|CONNREFUSED|NOTFOUND|Error -1021|Response code 429|Response code 5)/);

Trader.prototype.processError = function(funcName, error) {
  if (!error) return undefined;

  if (!error.message || !error.message.match(recoverableErrors)) {
    log.error(`[binance.js] (${funcName}) returned an irrecoverable error: ${error}`);
    return new Errors.AbortError('[binance.js] ' + error.message || error);
  }

  log.debug(`[binance.js] (${funcName}) returned an error, retrying: ${error}`);
  return new Errors.RetryError('[binance.js] ' + error.message || error);
};

Trader.prototype.handleResponse = function(funcName, callback) {
  return (error, body) => {
    if (body && body.code) {
      error = new Error(`Error ${body.code}: ${body.msg}`);
    }

    return callback(this.processError(funcName, error), body);
  }
};

Trader.prototype.getTrades = function(since, callback, descending) {
  var processResults = function(err, data) {
    if (err) return callback(err);

    var parsedTrades = [];
    _.each(
      data,
      function(trade) {
        parsedTrades.push({
          tid: trade.aggTradeId,
          date: moment(trade.timestamp).unix(),
          price: parseFloat(trade.price),
          amount: parseFloat(trade.quantity),
        });
      },
      this
    );

    if (descending) callback(null, parsedTrades.reverse());
    else callback(undefined, parsedTrades);
  };

  var reqData = {
    symbol: this.pair,
  };

  if (since) {
    var endTs = moment(since)
      .add(1, 'h')
      .valueOf();
    var nowTs = moment().valueOf();

    reqData.startTime = moment(since).valueOf();
    reqData.endTime = endTs > nowTs ? nowTs : endTs;
  }

  let handler = (cb) => this.binance.aggTrades(reqData, this.handleResponse('getTrades', cb));
  util.retryCustom(retryForever, _.bind(handler, this), _.bind(processResults, this));
};

Trader.prototype.getPortfolio = function(callback) {
  var setBalance = function(err, data) {
    log.debug(`[binance.js] entering "setBalance" callback after api call, err: ${err} data: ${JSON.stringify(data)}`)
    if (err) return callback(err);

    var findAsset = function(item) {
      return item.asset === this.asset;
    }
    var assetAmount = parseFloat(_.find(data.balances, _.bind(findAsset, this)).free);

    var findCurrency = function(item) {
      return item.asset === this.currency;
    }
    var currencyAmount = parseFloat(_.find(data.balances, _.bind(findCurrency, this)).free);

    if (!_.isNumber(assetAmount) || _.isNaN(assetAmount)) {
      log.error(
        `Binance did not return portfolio for ${this.asset}, assuming 0.`
      );
      assetAmount = 0;
    }

    if (!_.isNumber(currencyAmount) || _.isNaN(currencyAmount)) {
      log.error(
        `Binance did not return portfolio for ${this.currency}, assuming 0.`
      );
      currencyAmount = 0;
    }

    var portfolio = [
      { name: this.asset, amount: assetAmount },
      { name: this.currency, amount: currencyAmount },
    ];

    return callback(undefined, portfolio);
  };

  let handler = (cb) => this.binance.account({}, this.handleResponse('getPortfolio', cb));
  util.retryCustom(retryForever, _.bind(handler, this), _.bind(setBalance, this));
};

// This uses the base maker fee (0.1%), and does not account for BNB discounts
Trader.prototype.getFee = function(callback) {
  var makerFee = 0.1;
  callback(undefined, makerFee / 100);
};

Trader.prototype.getTicker = function(callback) {
  var setTicker = function(err, data) {
    log.debug(`[binance.js] entering "getTicker" callback after api call, err: ${err} data: ${(data || []).length} symbols`);
    if (err) return callback(err);

    var findSymbol = function(ticker) {
      return ticker.symbol === this.pair;
    }
    var result = _.find(data, _.bind(findSymbol, this));

    var ticker = {
      ask: parseFloat(result.askPrice),
      bid: parseFloat(result.bidPrice),
    };

    callback(undefined, ticker);
  };

  let handler = (cb) => this.binance._makeRequest({}, this.handleResponse('getTicker', cb), 'api/v1/ticker/allBookTickers');
  util.retryCustom(retryForever, _.bind(handler, this), _.bind(setTicker, this));
};

// Effectively counts the number of decimal places, so 0.001 or 0.234 results in 3
Trader.prototype.getPrecision = function(tickSize) {
  if (!isFinite(tickSize)) return 0;
  var e = 1, p = 0;
  while (Math.round(tickSize * e) / e !== tickSize) { e *= 10; p++; }
  return p;
};

Trader.prototype.roundAmount = function(amount, tickSize) {
  var precision = 100000000;
  var t = this.getPrecision(tickSize);

  if(Number.isInteger(t))
    precision = Math.pow(10, t);

  amount *= precision;
  amount = Math.floor(amount);
  amount /= precision;
  return amount;
};

Trader.prototype.getLotSize = function(tradeType, amount, price, callback) {
  amount = this.roundAmount(amount, this.market.minimalOrder.amount);
  if (amount < this.market.minimalOrder.amount)
    return callback(undefined, { amount: 0, price: 0 });

  price = this.roundAmount(price, this.market.minimalOrder.price)
  if (price < this.market.minimalOrder.price)
    return callback(undefined, { amount: 0, price: 0 });

  if (amount * price < this.market.minimalOrder.order)
    return callback(undefined, { amount: 0, price: 0});

  callback(undefined, { amount: amount, price: price });
}

Trader.prototype.addOrder = function(tradeType, amount, price, callback) {
  log.debug(`[binance.js] (addOrder) ${tradeType.toUpperCase()} ${amount} ${this.asset} @${price} ${this.currency}`);

  var setOrder = function(err, data) {
    log.debug(`[binance.js] entering "setOrder" callback after api call, err: ${err} data: ${JSON.stringify(data)}`);
    if (err) return callback(err);

    var txid = data.orderId;
    log.debug(`[binance.js] added order with txid: ${txid}`);

    callback(undefined, txid);
  };

  let reqData = {
    symbol: this.pair,
    side: tradeType.toUpperCase(),
    type: 'LIMIT',
    timeInForce: 'GTC', // Good to cancel (I think, not really covered in docs, but is default)
    quantity: amount,
    price: price,
    timestamp: new Date().getTime()
  };

  let handler = (cb) => this.binance.newOrder(reqData, this.handleResponse('addOrder', cb));
  util.retryCustom(retryCritical, _.bind(handler, this), _.bind(setOrder, this));
};

Trader.prototype.getOrder = function(order, callback) {
  var get = function(err, data) {
    log.debug(`[binance.js] entering "getOrder" callback after api call, err ${err} data: ${JSON.stringify(data)}`);
    if (err) return callback(err);

    var price = parseFloat(data.price);
    var amount = parseFloat(data.executedQty);
    
    // Data.time is a 13 digit millisecon unix time stamp.
    // https://momentjs.com/docs/#/parsing/unix-timestamp-milliseconds/ 
    var date = moment(data.time);

    callback(undefined, { price, amount, date });
  }.bind(this);

  let reqData = {
    symbol: this.pair,
    orderId: order,
  };

  let handler = (cb) => this.binance.queryOrder(reqData, this.handleResponse('getOrder', cb));
  util.retryCustom(retryCritical, _.bind(handler, this), _.bind(get, this));
};

Trader.prototype.buy = function(amount, price, callback) {
  this.addOrder('buy', amount, price, callback);
};

Trader.prototype.sell = function(amount, price, callback) {
  this.addOrder('sell', amount, price, callback);
};

Trader.prototype.checkOrder = function(order, callback) {
  var check = function(err, data) {
    log.debug(`[binance.js] entering "checkOrder" callback after api call, err ${err} data: ${JSON.stringify(data)}`);
    if (err) return callback(err);

    var stillThere = data.status === 'NEW' || data.status === 'PARTIALLY_FILLED';
    var canceledManually = data.status === 'CANCELED' || data.status === 'REJECTED' || data.status === 'EXPIRED';
    callback(undefined, !stillThere && !canceledManually);
  };

  let reqData = {
    symbol: this.pair,
    orderId: order,
  };

  let handler = (cb) => this.binance.queryOrder(reqData, this.handleResponse('checkOrder', cb));
  util.retryCustom(retryCritical, _.bind(handler, this), _.bind(check, this));
};

Trader.prototype.cancelOrder = function(order, callback) {
  // callback for cancelOrder should be true if the order was already filled, otherwise false
  var cancel = function(err, data) {
    log.debug(`[binance.js] entering "cancelOrder" callback after api call, err ${err} data: ${JSON.stringify(data)}`);
    if (err) {
      if(data && data.msg === 'UNKNOWN_ORDER') {  // this seems to be the response we get when an order was filled
        return callback(true); // tell the thing the order was already filled
      }
      return callback(err);
    }
    callback(undefined);
  };

  let reqData = {
    symbol: this.pair,
    orderId: order,
  };

  let handler = (cb) => this.binance.cancelOrder(reqData, this.handleResponse('cancelOrder', cb));
  util.retryCustom(retryForever, _.bind(handler, this), _.bind(cancel, this));
};

Trader.prototype.initMarkets = function(callback) {

}

Trader.getCapabilities = function() {
  return {
    name: 'Binance',
    slug: 'binance',
    currencies: marketData.currencies,
    assets: marketData.assets,
    markets: marketData.markets,
    requires: ['key', 'secret'],
    providesHistory: 'date',
    providesFullHistory: true,
    tid: 'tid',
    tradable: true,
  };
};

module.exports = Trader;
