var Gdax = require('gdax');
var _ = require('lodash');
var moment = require('moment');

const util = require('../core/util');
const Errors = require('../core/error');
const log = require('../core/log');

const BATCH_SIZE = 100;

var Trader = function(config) {
  _.bindAll(this);

  this.post_only = true;
  this.use_sandbox = false;
  this.name = 'GDAX';
  this.scanback = false;
  this.scanbackTid = 0;
  this.scanbackResults = [];
  this.asset = config.asset;
  this.currency = config.currency;

  if (_.isObject(config)) {
    this.key = config.key;
    this.secret = config.secret;
    this.passphrase = config.passphrase;

    this.pair = [config.asset, config.currency].join('-').toUpperCase();
    this.post_only =
      typeof config.post_only !== 'undefined' ? config.post_only : true;
  }

  this.gdax_public = new Gdax.PublicClient(
    this.pair,
    this.use_sandbox ? 'https://api-public.sandbox.gdax.com' : undefined
  );
  this.gdax = new Gdax.AuthenticatedClient(
    this.key,
    this.secret,
    this.passphrase,
    this.use_sandbox ? 'https://api-public.sandbox.gdax.com' : undefined
  );
};

var retryCritical = {
  retries: 10,
  factor: 1.2,
  minTimeout: 10 * 1000,
  maxTimeout: 60 * 1000,
};

var retryForever = {
  forever: true,
  factor: 1.2,
  minTimeout: 10 * 1000,
  maxTimeout: 300 * 1000,
};

// Probably we need to update these string
var recoverableErrors = new RegExp(
  /(SOCKETTIMEDOUT|TIMEDOUT|CONNRESET|CONNREFUSED|NOTFOUND|Rate limit exceeded|Response code 5)/
);

Trader.prototype.processError = function(funcName, error) {
  if (!error) return undefined;

  if (!error.message.match(recoverableErrors)) {
    log.error(
      `[gdax.js] (${funcName}) returned an irrecoverable error: ${
        error.message
      }`
    );
    return new Errors.AbortError('[gdax.js] ' + error.message);
  }

  log.debug(
    `[gdax.js] (${funcName}) returned an error, retrying: ${error.message}`
  );
  return new Errors.RetryError('[gdax.js] ' + error.message);
};

Trader.prototype.handleResponse = function(funcName, callback) {
  return (error, response, body) => {
    if (body && !_.isEmpty(body.message)) error = new Error(body.message);
    else if (
      response &&
      response.statusCode < 200 &&
      response.statusCode >= 300
    )
      error = new Error(`Response code ${response.statusCode}`);

    return callback(this.processError(funcName, error), body);
  };
};

Trader.prototype.getPortfolio = function(callback) {
  var result = function(err, data) {
    if (err) return callback(err);

    var portfolio = data.map(function(account) {
      return {
        name: account.currency.toUpperCase(),
        amount: parseFloat(account.available),
      };
    });
    callback(undefined, portfolio);
  };

  let handler = cb =>
    this.gdax.getAccounts(this.handleResponse('getPortfolio', cb));
  util.retryCustom(retryForever, _.bind(handler, this), _.bind(result, this));
};

Trader.prototype.getTicker = function(callback) {
  var result = function(err, data) {
    if (err) return callback(err);
    callback(undefined, { bid: +data.bid, ask: +data.ask });
  };

  let handler = cb =>
    this.gdax_public.getProductTicker(this.handleResponse('getTicker', cb));
  util.retryCustom(retryForever, _.bind(handler, this), _.bind(result, this));
};

Trader.prototype.getFee = function(callback) {
  //https://www.gdax.com/fees
  const fee = this.asset == 'BTC' ? 0.0025 : 0.003;

  //There is no maker fee, not sure if we need taker fee here
  //If post only is enabled, gdax only does maker trades which are free
  callback(undefined, this.post_only ? 0 : fee);
};

Trader.prototype.buy = function(amount, price, callback) {
  var buyParams = {
    price: this.getMaxDecimalsNumber(price, this.currency == 'BTC' ? 5 : 2),
    size: this.getMaxDecimalsNumber(amount),
    product_id: this.pair,
    post_only: this.post_only,
  };

  var result = (err, data) => {
    if (err) return callback(err);
    callback(undefined, data.id);
  };

  let handler = cb => this.gdax.buy(buyParams, this.handleResponse('buy', cb));
  util.retryCustom(retryCritical, _.bind(handler, this), _.bind(result, this));
};

Trader.prototype.sell = function(amount, price, callback) {
  var sellParams = {
    price: this.getMaxDecimalsNumber(price, this.currency == 'BTC' ? 5 : 2),
    size: this.getMaxDecimalsNumber(amount),
    product_id: this.pair,
    post_only: this.post_only,
  };

  var result = function(err, data) {
    if (err) return callback(err);
    callback(undefined, data.id);
  };

  let handler = cb =>
    this.gdax.sell(sellParams, this.handleResponse('buy', cb));
  util.retryCustom(retryCritical, _.bind(handler, this), _.bind(result, this));
};

Trader.prototype.checkOrder = function(order, callback) {
  var result = function(err, data) {
    if (err) return callback(err);

    var status = data.status;
    if (status == 'done') {
      return callback(undefined, true);
    } else if (status == 'rejected') {
      return callback(undefined, false);
    } else if (status == 'pending') {
      return callback(undefined, false);
    }
    callback(undefined, false);
  };

  let handler = cb =>
    this.gdax.getOrder(order, this.handleResponse('checkOrder', cb));
  util.retryCustom(retryCritical, _.bind(handler, this), _.bind(result, this));
};

Trader.prototype.getOrder = function(order, callback) {
  var result = function(err, data) {
    if (err) return callback(err);

    var price = parseFloat(data.price);
    var amount = parseFloat(data.filled_size);
    var date = moment(data.done_at);

    callback(undefined, { price, amount, date });
  };

  let handler = cb =>
    this.gdax.getOrder(order, this.handleResponse('getOrder', cb));
  util.retryCustom(retryForever, _.bind(handler, this), _.bind(result, this));
};

Trader.prototype.cancelOrder = function(order, callback) {
  var result = function(err, data) {
    // todo, verify result..
    callback();
  };

  let handler = cb =>
    this.gdax.cancelOrder(order, this.handleResponse('cancelOrder', cb));
  util.retryCustom(retryForever, _.bind(handler, this), _.bind(result, this));
};

Trader.prototype.getTrades = function(since, callback, descending) {
  var lastScan = 0;

  var process = function(err, data) {
    if (err) return callback(err);

    var result = _.map(data, function(trade) {
      return {
        tid: trade.trade_id,
        amount: parseFloat(trade.size),
        date: moment.utc(trade.time).format('X'),
        price: parseFloat(trade.price),
      };
    });

    if (this.scanback) {
      var last = _.last(data);
      var first = _.first(data);

      // Try to find trade id matching the since date
      if (!this.scanbackTid) {
        // either scan for new ones or we found it.
        if (moment.utc(last.time) < moment.utc(since)) {
          this.scanbackTid = last.trade_id;
        } else {
          log.debug('Scanning backwards...' + last.time);
          setTimeout(() => {
            let handler = cb =>
              this.gdax_public.getProductTrades(
                {
                  after: last.trade_id - BATCH_SIZE * lastScan,
                  limit: BATCH_SIZE,
                },
                this.handleResponse('getTrades', cb)
              );
            util.retryCustom(
              retryForever,
              _.bind(handler, this),
              _.bind(process, this)
            );
          }, QUERY_DELAY);
          lastScan++;
          if (lastScan > 100) {
            lastScan = 10;
          }
        }
      }

      if (this.scanbackTid) {
        // if scanbackTid is set we need to move forward again
        log.debug(
          'Backwards: ' +
            last.time +
            ' (' +
            last.trade_id +
            ') to ' +
            first.time +
            ' (' +
            first.trade_id +
            ')'
        );

        this.scanbackResults = this.scanbackResults.concat(result.reverse());

        if (this.scanbackTid != first.trade_id) {
          this.scanbackTid = first.trade_id;
          setTimeout(() => {
            let handler = cb =>
              this.gdax_public.getProductTrades(
                { after: this.scanbackTid + BATCH_SIZE + 1, limit: BATCH_SIZE },
                this.handleResponse('getTrades', cb)
              );
            util.retryCustom(
              retryForever,
              _.bind(handler, this),
              _.bind(process, this)
            );
          }, QUERY_DELAY);
        } else {
          this.scanback = false;
          this.scanbackTid = 0;

          log.debug('Scan finished: data found:' + this.scanbackResults.length);
          callback(null, this.scanbackResults);

          this.scanbackResults = [];
        }
      }
    } else {
      callback(null, result.reverse());
    }
  };

  if (since || this.scanback) {
    this.scanback = true;
    if (this.scanbackTid) {
      let handler = cb =>
        this.gdax_public.getProductTrades(
          { after: this.scanbackTid + BATCH_SIZE + 1, limit: BATCH_SIZE },
          this.handleResponse('getTrades', cb)
        );
      util.retryCustom(
        retryForever,
        _.bind(handler, this),
        _.bind(process, this)
      );
    } else {
      log.debug('Scanning back in the history needed...');
      log.debug(moment.utc(since).format());
    }
  }

  let handler = cb =>
    this.gdax_public.getProductTrades(
      { limit: BATCH_SIZE },
      this.handleResponse('getTrades', cb)
    );
  util.retryCustom(retryForever, _.bind(handler, this), _.bind(process, this));
};

Trader.prototype.getMaxDecimalsNumber = function(number, decimalLimit = 8) {
  var decimalNumber = parseFloat(number);

  // The ^-?\d*\. strips off any sign, integer portion, and decimal point
  // leaving only the decimal fraction.
  // The 0+$ strips off any trailing zeroes.
  var decimalCount = (+decimalNumber).toString().replace(/^-?\d*\.?|0+$/g, '')
    .length;

  var decimalMultiplier = 1;
  for (i = 0; i < decimalLimit; i++) {
    decimalMultiplier *= 10;
  }

  return decimalCount <= decimalLimit
    ? decimalNumber.toString()
    : (
        Math.floor(decimalNumber * decimalMultiplier) / decimalMultiplier
      ).toFixed(decimalLimit);
};

Trader.getCapabilities = function() {
  return {
    name: 'GDAX',
    slug: 'gdax',
    currencies: ['USD', 'EUR', 'GBP', 'BTC'],
    assets: ['BTC', 'LTC', 'ETH'],
    markets: [
      { pair: ['USD', 'BTC'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['USD', 'LTC'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['USD', 'ETH'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['EUR', 'BTC'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['EUR', 'ETH'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['EUR', 'LTC'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['GBP', 'BTC'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['BTC', 'LTC'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['BTC', 'ETH'], minimalOrder: { amount: 0.01, unit: 'asset' } },
    ],
    requires: ['key', 'secret', 'passphrase'],
    providesHistory: 'date',
    providesFullHistory: true,
    tid: 'tid',
    tradable: true,
    forceReorderDelay: true,
  };
};

module.exports = Trader;
