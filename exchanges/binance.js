const moment = require('moment');
const util = require('../core/util');
const _ = require('lodash');
const log = require('../core/log');

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

  this.binance = new Binance.BinanceRest({
    key: this.key,
    secret: this.secret,
    timeout: 15000,
    recvWindow: 60000, // suggested by binance
    disableBeautification: false, // better field names
  });
};

var recoverableErrors = new RegExp(
  /(SOCKETTIMEDOUT|TIMEDOUT|CONNRESET|CONNREFUSED|NOTFOUND|API:Invalid nonce|between Cloudflare and the origin web server)/
);

Trader.prototype.retry = function(method, args, error) {
  if (!error || !error.message.match(recoverableErrors)) {
    log.error('[binance.js] ', this.name, 'returned an irrecoverable error');
    return;
  }

  var wait = +moment.duration(5, 'seconds');
  log.debug(
    '[binance.js] (retry) ',
    this.name,
    'returned an error, retrying..'
  );

  var self = this;

  // make sure the callback (and any other fn)
  // is bound to Trader
  _.each(args, function(arg, i) {
    if (_.isFunction(arg)) args[i] = _.bind(arg, self);
  });

  // run the failed method again with the same
  // arguments after wait
  setTimeout(function() {
    method.apply(self, args);
  }, wait);
};

Trader.prototype.getTrades = function(since, callback, descending) {
  var args = _.toArray(arguments);

  var process = function(err, data) {
    if (!err && !_.isEmpty(data.msg)) err = new Error(data.msg);

    if (err) {
      log.error('[binance.js] error getting trades', err);
      return this.retry(this.getTrades, args, err);
    }

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
    else callback(null, parsedTrades);
  };

  var reqData = {
    symbol: this.pair,
  };

  if (since) {
    var endTs = moment(since)
      .add(1, 'd')
      .valueOf();
    var nowTs = moment().valueOf();

    reqData.startTime = moment(since).valueOf();
    reqData.endTime = endTs > nowTs ? nowTs : endTs;
  }

  this.binance.aggTrades(reqData, _.bind(process, this));
};

Trader.prototype.getPortfolio = function(callback) {
  var args = _.toArray(arguments);
  var setBalance = function(err, data) {
    log.debug(
      '[binance.js] entering "setBalance" callback after api call, err:',
      err,
      ' data:',
      data
    );

    if (!err && !_.isEmpty(data.msg)) err = new Error(data.msg);

    if (err) {
      log.error('[binance.js] ', err);
      return this.retry(this.getPortfolio, args, err);
    }

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

    return callback(err.message, portfolio);
  };

  this.binance.account({}, _.bind(setBalance, this));
};

// This uses the base maker fee (0.1%), and does not account for BNB discounts
Trader.prototype.getFee = function(callback) {
  var makerFee = 0.1;
  callback(false, makerFee / 100);
};

Trader.prototype.getTicker = function(callback) {
  var setTicker = function(err, data) {
    log.debug(
      '[binance.js] entering "getTicker" callback after api call, err:',
      err,
      ' data:',
      data
    );

    if (!err && !_.isEmpty(data.msg)) err = new Error(data.msg);

    if (err)
      return log.error(
        '[binance.js] unable to get ticker',
        JSON.stringify(err)
      );

    var findSymbol = function(ticker) {
      return ticker.symbol === this.pair;
    }
    var result = _.find(data, _.bind(findSymbol, this));

    var ticker = {
      ask: parseFloat(result.askPrice),
      bid: parseFloat(result.bidPrice),
    };

    callback(err.message, ticker);
  };

  // Not exposed by the API yet, have to do it the hard way
  this.binance._makeRequest(
    {},
    _.bind(setTicker, this),
    'ticker/allBookTickers'
  );
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

Trader.prototype.addOrder = function(tradeType, amount, price, callback) {
  var args = _.toArray(arguments);

  var findMarket = function(market) {
    return market.pair[0] === this.currency && market.pair[1] === this.asset
  }
  var market = _.find(Trader.getCapabilities().markets, _.bind(findMarket, this));
  amount = Math.max(this.roundAmount(amount, market.minimalOrder.amount), market.minimalOrder.amount);
  price = Math.max(this.roundAmount(price, market.precision), market.precision);

  log.debug(
    '[binance.js] (addOrder)',
    tradeType.toUpperCase(),
    amount,
    this.asset,
    '@',
    price,
    this.currency
  );

  var setOrder = function(err, data) {
    log.debug(
      '[binance.js] entering "setOrder" callback after api call, err:',
      err,
      ' data:',
      data
    );

    if (!err && !_.isEmpty(data.msg)) err = new Error(data.msg);

    if (err) {
      log.error('[binance.js] unable to ' + tradeType.toLowerCase(), err);
      return this.retry(this.addOrder, args, err);
    }

    var txid = data.orderId;
    log.debug('added order with txid:', txid);

    callback(undefined, txid);
  };

  this.binance.newOrder(
    {
      symbol: this.pair,
      side: tradeType.toUpperCase(),
      type: 'LIMIT',
      timeInForce: 'GTC', // Good to cancel (I think, not really covered in docs, but is default)
      quantity: amount,
      price: price,
      timestamp: new Date().getTime()
    },
    _.bind(setOrder, this)
  );
};

Trader.prototype.getOrder = function(order, callback) {
  var get = function(err, data) {
    log.debug(
      '[binance.js] entering "getOrder" callback after api call, err:',
      err,
      ' data:',
      data
    );

    if (!err && !_.isEmpty(data.msg)) err = new Error(data.msg);

    if (err)
      return log.error(
        '[binance.js] unable to get order',
        order,
        JSON.stringify(err)
      );

    var price = parseFloat(data.price);
    var amount = parseFloat(data.executedQty);
    var date = moment.unix(data.time);

    callback(undefined, { price, amount, date });
  }.bind(this);

  this.binance.queryOrder(
    {
      symbol: this.pair,
      orderId: order,
    },
    get
  );
};

Trader.prototype.buy = function(amount, price, callback) {
  this.addOrder('buy', amount, price, callback);
};

Trader.prototype.sell = function(amount, price, callback) {
  this.addOrder('sell', amount, price, callback);
};

Trader.prototype.checkOrder = function(order, callback) {
  var check = function(err, data) {
    log.debug(
      '[binance.js] entering "checkOrder" callback after api call, err:',
      err,
      ' data:',
      data
    );

    if (!err && !_.isEmpty(data.msg)) err = new Error(data.msg);

    if (err)
      return log.error(
        '[binance.js] Unable to check order',
        order,
        JSON.stringify(err)
      );

    var stillThere =
      data.status === 'NEW' || data.status === 'PARTIALLY_FILLED';
    callback(err.message, !stillThere);
  };

  this.binance.queryOrder(
    {
      symbol: this.pair,
      orderId: order,
    },
    _.bind(check, this)
  );
};

Trader.prototype.cancelOrder = function(order, callback) {
  var args = _.toArray(arguments);
  var cancel = function(err, data) {
    log.debug(
      '[binance.js] entering "cancelOrder" callback after api call, err:',
      err,
      ' data:',
      data
    );

    if (!err && !_.isEmpty(data.msg)) err = new Error(data.msg);

    if (err) {
      log.error(
        '[binance.js] unable to cancel order',
        order,
        '(',
        err,
        JSON.stringify(err),
        ')'
      );
      return this.retry(this.cancelOrder, args, err);
    }

    callback();
  };

  this.binance.cancelOrder(
    {
      symbol: this.pair,
      orderId: order,
    },
    _.bind(cancel, this)
  );
};

Trader.getCapabilities = function() {
  return {
    name: 'Binance',
    slug: 'binance',
    currencies: ['BTC', 'BNB', 'ETH', 'USDT'],
    assets: [
      'BTC',
      'BCC',
      'BCG',
      'BNB',
      'DASH',
      'ETH',
      'ETC',
      'EOS',
      'NEO',
      'OMG',
      'POWR',
      'QTUM',
      'ZEC',
    ],
    markets: [
      // https://www.binance.com/exchange/public/product

      //Tradeable againt BTC
      {
        pair: ['BTC', 'BCC'],
        minimalOrder: { amount: 0.001, unit: 'asset' },
        precision: 0.000001,
      },
      {
        pair: ['BTC', 'BNB'],
        minimalOrder: { amount: 1, unit: 'asset' },
        precision: 0.00000001,
      },
      {
        pair: ['BTC', 'DASH'],
        minimalOrder: { amount: 0.001, unit: 'asset' },
        precision: 0.000001,
      },
      {
        pair: ['BTC', 'ETH'],
        minimalOrder: { amount: 0.001, unit: 'asset' },
        precision: 0.000001,
      },
      {
        pair: ['BTC', 'ETC'],
        minimalOrder: { amount: 0.01, unit: 'asset' },
        precision: 0.000001,
      },
      {
        pair: ['BTC', 'EOS'],
        minimalOrder: { amount: 1.0, unit: 'asset' },
        precision: 0.00000001,
      },
      {
        pair: ['BTC', 'NEO'],
        minimalOrder: { amount: 0.01, unit: 'asset' },
        precision: 0.000001,
      },
      {
        pair: ['BTC', 'OMG'],
        minimalOrder: { amount: 0.01, unit: 'asset' },
        precision: 0.000001,
      },
      {
        pair: ['BTC', 'POWR'],
        minimalOrder: { amount: 0.01, unit: 'asset' },
        precision: 0.00000001,
      },
      {
        pair: ['BTC', 'QTUM'],
        minimalOrder: { amount: 0.01, unit: 'asset' },
        precision: 0.000001,
      },
      {
        pair: ['BTC', 'ZEC'],
        minimalOrder: { amount: 0.001, unit: 'asset' },
        precision: 0.000001,
      },

      //Tradeable againt BNB
      {
        pair: ['BNB', 'BCC'],
        minimalOrder: { amount: 0.00001, unit: 'asset' },
        precision: 0.01,
      },
      {
        pair: ['BNB', 'NEO'],
        minimalOrder: { amount: 0.001, unit: 'asset' },
        precision: 0.001,
      },

      //Tradeable againt ETH
      {
        pair: ['ETH', 'BCC'],
        minimalOrder: { amount: 0.001, unit: 'asset' },
        precision: 0.00001,
      },
      {
        pair: ['ETH', 'BNB'],
        minimalOrder: { amount: 1.0, unit: 'asset' },
        precision: 0.00000001,
      },
      {
        pair: ['ETH', 'DASH'],
        minimalOrder: { amount: 0.001, unit: 'asset' },
        precision: 0.00001,
      },
      {
        pair: ['ETH', 'ETC'],
        minimalOrder: { amount: 0.01, unit: 'asset' },
        precision: 0.000001,
      },
      {
        pair: ['ETH', 'EOS'],
        minimalOrder: { amount: 0.01, unit: 'asset' },
        precision: 0.000001,
      },
      {
        pair: ['ETH', 'NEO'],
        minimalOrder: { amount: 0.01, unit: 'asset' },
        precision: 0.000001,
      },
      {
        pair: ['ETH', 'OMG'],
        minimalOrder: { amount: 0.01, unit: 'asset' },
        precision: 0.000001,
      },
      {
        pair: ['ETH', 'POWR'],
        minimalOrder: { amount: 1, unit: 'asset' },
        precision: 0.00000001,
      },
      {
        pair: ['ETH', 'QTUM'],
        minimalOrder: { amount: 0.01, unit: 'asset' },
        precision: 0.000001,
      },
      {
        pair: ['ETH', 'ZEC'],
        minimalOrder: { amount: 0.001, unit: 'asset' },
        precision: 00001,
      },

      //Tradeable againt USDT
      {
        pair: ['USDT', 'BTC'],
        minimalOrder: { amount: 0.000001, unit: 'asset' },
        precision: 0.01,
      },
      {
        pair: ['USDT', 'BCC'],
        minimalOrder: { amount: 0.00001, unit: 'asset' },
        precision: 0.01,
      },
      {
        pair: ['USDT', 'BNB'],
        minimalOrder: { amount: 0.01, unit: 'asset' },
        precision: 0.01,
      },
      {
        pair: ['USDT', 'ETH'],
        minimalOrder: { amount: 0.00001, unit: 'asset' },
        precision: 0.01,
      },
      {
        pair: ['USDT', 'NEO'],
        minimalOrder: { amount: 0.001, unit: 'asset' },
        precision: 0.01,
      },
    ],
    requires: ['key', 'secret'],
    providesHistory: 'date',
    providesFullHistory: true,
    tid: 'tid',
    tradable: true,
  };
};

module.exports = Trader;
