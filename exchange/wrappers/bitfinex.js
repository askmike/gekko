
const Bitfinex = require("bitfinex-api-node");
const _ = require('lodash');
const moment = require('moment');

const Errors = require('./exchangeErrors');
const retry = require('./exchangeUtils').retry;

const marketData = require('./bitfinex-markets.json');

var Trader = function(config) {
  _.bindAll(this);
  if(_.isObject(config)) {
    this.key = config.key;
    this.secret = config.secret;
  }
  this.name = 'Bitfinex';
  this.balance;
  this.price;
  this.asset = config.asset;
  this.currency = config.currency;
  this.pair = this.asset + this.currency;
  this.bitfinex = new Bitfinex(this.key, this.secret, { version: 1 }).rest;
}

var retryCritical = {
  retries: 10,
  factor: 1.2,
  minTimeout: 10 * 1000,
  maxTimeout: 60 * 1000
};

var retryForever = {
  forever: true,
  factor: 1.2,
  minTimeout: 10 * 1000,
  maxTimeout: 300 * 1000
};

const includes = (str, list) => {
  if(!_.isString(str))
    return false;

  return _.some(list, str.includes(item));
}

// Probably we need to update these string
const recoverableErrors = [
  'SOCKETTIMEDOUT',
  'TIMEDOUT',
  'CONNRESET',
  'CONNREFUSED',
  'NOTFOUND',
  '429',
  '443',
  '504',
  '503',
  '500',
  '502'
];

Trader.prototype.processError = function(funcName, error) {
  if (!error) return undefined;

  const message = error.message || error;

  if (!includes(message, recoverableErrors)) {
    log.error(`[bitfinex.js] (${funcName}) returned an irrecoverable error: ${error.message}`);
    return new Errors.AbortError('[bitfinex.js] ' + error.message);
  }

  log.debug(`[bitfinex.js] (${funcName}) returned an error, retrying: ${error.message}`);
  return new Errors.RetryError('[bitfinex.js] ' + error.message);
};

Trader.prototype.handleResponse = function(funcName, callback) {
  return (error, data, body) => {
    return callback(this.processError(funcName, error), data);
  }
};

Trader.prototype.getPortfolio = function(callback) {
  const processResponse = (err, data) => {
    if (err) return callback(err);

    // We are only interested in funds in the "exchange" wallet
    data = data.filter(c => c.type === 'exchange');

    const asset = _.find(data, c => c.currency.toUpperCase() === this.asset);
    const currency = _.find(data, c => c.currency.toUpperCase() === this.currency);

    let assetAmount, currencyAmount;

    if(_.isObject(asset) && _.isNumber(+asset.available) && !_.isNaN(+asset.available))
      assetAmount = +asset.available;
    else {
      log.error(`Bitfinex did not provide ${this.asset} amount, assuming 0`);
      assetAmount = 0;
    }

    if(_.isObject(currency) && _.isNumber(+currency.available) && !_.isNaN(+currency.available))
      currencyAmount = +currency.available;
    else {
      log.error(`Bitfinex did not provide ${this.currency} amount, assuming 0`);
      currencyAmount = 0;
    }

    const portfolio = [
      { name: this.asset, amount: assetAmount },
      { name: this.currency, amount: currencyAmount },
    ];

    callback(undefined, portfolio);
  };

  const handler = cb => this.bitfinex.wallet_balances(this.handleResponse('getPortfolio', cb));
  retry(retryForever, handler, processResponse);
}

Trader.prototype.getTicker = function(callback) {
  const processResponse = (err, data) => {
    if (err) return callback(err);

    // whenever we reach this point we have valid
    // data, the callback is still the same since
    // we are inside the same javascript scope.
    callback(undefined, {bid: +data.bid, ask: +data.ask})
  };
  
  const handler = cb => this.bitfinex.ticker(this.pair, this.handleResponse('getTicker', cb));
  retry(retryForever, handler, processResponse);
}

Trader.prototype.getFee = function(callback) {
    const makerFee = 0.1;
    // const takerFee = 0.2;
    callback(undefined, makerFee / 100);
}

Trader.prototype.roundAmount = function(amount) {
  return Math.floor(amount*100000000)/100000000;
}

Trader.prototype.roundPrice = function(price) {
  // todo: calc significant digits
  return price;
}

Trader.prototype.submit_order = function(type, amount, price, callback) {
  const processResponse = (err, data) => {
    if (err) return callback(err);

    callback(err, data.order_id);
  }

  const handler = cb => this.bitfinex.new_order(this.pair,
    amount + '',
    price + '',
    this.name.toLowerCase(),
    type,
    'exchange limit',
    this.handleResponse('submitOrder', cb)
  );

  retry(retryCritical, handler, processResponse);
}

Trader.prototype.buy = function(amount, price, callback) {
  this.submit_order('buy', amount, price, callback);
}

Trader.prototype.sell = function(amount, price, callback) {
  this.submit_order('sell', amount, price, callback);
}

Trader.prototype.checkOrder = function(order_id, callback) {
  const processResponse = (err, data) => {
    if (err) return callback(err);

    return callback(undefined, {
      open: data.is_live,
      executed: data.original_amount === data.executed_amount,
      filled: +data.executed_amount
    });
  }

  const handler = cb => this.bitfinex.order_status(order_id, this.handleResponse('checkOrder', cb));
  retry(retryCritical, handler, processResponse);
}


Trader.prototype.getOrder = function(order_id, callback) {
  const processResponse = (err, data) => {
    if (err) return callback(err);

    var price = parseFloat(data.avg_execution_price);
    var amount = parseFloat(data.executed_amount);
    var date = moment.unix(data.timestamp);

    callback(undefined, {price, amount, date});
  };

  const handler = cb => this.bitfinex.order_status(order_id, this.handleResponse('getOrder', cb));
  retry(retryCritical, handler, processResponse);
}


Trader.prototype.cancelOrder = function(order_id, callback) {
  const processResponse = (err, data) => {
    if (err) return callback(err);

    return callback(undefined);
  }

  const handler = cb => this.bitfinex.cancel_order(order_id, this.handleResponse('cancelOrder', cb));
  retry(retryForever, handler, processResponse);
}

Trader.prototype.getTrades = function(since, callback, descending) {
  const processResponse = (err, data) => {  
    if (err) return callback(err);

    var trades = _.map(data, function(trade) {
      return {
        tid: trade.tid, 
        date:  trade.timestamp, 
        price: +trade.price, 
        amount: +trade.amount
      }
    });

    callback(undefined, descending ? trades : trades.reverse());
  };

  var path = this.pair; 
  if(since) 
    path += '?limit_trades=2000'; 

  const handler = cb => this.bitfinex.trades(path, this.handleResponse('getTrades', cb));
  retry(retryForever, handler, processResponse);
}

Trader.getCapabilities = function () {
  return {
    name: 'Bitfinex',
    slug: 'bitfinex',
    currencies: marketData.currencies,
    assets: marketData.assets,
    markets: marketData.markets,
    requires: ['key', 'secret'],
    tid: 'tid',
    providesFullHistory: true,
    providesHistory: 'date',
    tradable: true,
    forceReorderDelay: true
  };
}

module.exports = Trader;
