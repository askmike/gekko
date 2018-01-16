const moment = require('moment');
const _ = require('lodash');

const util = require('../core/util');
const Errors = require('../core/error');
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
    disableBeautification: false
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

var recoverableErrors = new RegExp(/(SOCKETTIMEDOUT|TIMEDOUT|CONNRESET|CONNREFUSED|NOTFOUND|Error -1021|Response code 429)/);

Trader.prototype.processError = function(funcName, error) {
  if (!error) return undefined;

  if (!error.message || !error.message.match(recoverableErrors)) {
    log.error(`[binance.js] (${funcName}) returned an irrecoverable error: ${error.message}`);
    return new Errors.AbortError('[binance.js] ' + error.message || error);
  }

  log.debug(`[binance.js] (${funcName}) returned an error, retrying: ${error.message}`);
  return new Errors.RetryError('[binance.js] ' + error.message || error);
};

Trader.prototype.handleResponse = function(funcName, callback) {
  return (error, body) => {
    if (body && !_.isEmpty(body.code)) {
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
    log.debug(`[binance.js] entering "setBalance" callback after api call, err: ${err}, data: ${data}`)
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
    log.debug(`[binance.js] entering "getTicker" callback after api call, err: ${err} data: ${JSON.stringify(data)}`);
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

Trader.prototype.addOrder = function(tradeType, amount, price, callback) {
  var findMarket = function(market) {
    return market.pair[0] === this.currency && market.pair[1] === this.asset
  }
  var market = _.find(Trader.getCapabilities().markets, _.bind(findMarket, this));
  amount = Math.max(this.roundAmount(amount, market.minimalOrder.amount), market.minimalOrder.amount);
  price = Math.max(this.roundAmount(price, market.precision), market.precision);

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
    var date = moment.unix(data.time);

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
    callback(undefined, !stillThere);
  };

  let reqData = {
    symbol: this.pair,
    orderId: order,
  };

  let handler = (cb) => this.binance.queryOrder(reqData, this.handleResponse('checkOrder', cb));
  util.retryCustom(retryCritical, _.bind(handler, this), _.bind(check, this));
};

Trader.prototype.cancelOrder = function(order, callback) {
  var args = _.toArray(arguments);
  var cancel = function(err, data) {
    log.debug(`[binance.js] entering "cancelOrder" callback after api call, err ${err} data: ${JSON.stringify(data)}`);
    if (err) return callback(err);
    callback(undefined);
  };

  let reqData = {
    symbol: this.pair,
    orderId: order,
  };

  let handler = (cb) => this.binance.cancelOrder(reqData, this.handleResponse('cancelOrder', cb));
  util.retryCustom(retryForever, _.bind(handler, this), _.bind(cancel, this));
};

Trader.getCapabilities = function() {
  return {
    name: 'Binance',
    slug: 'binance',
    currencies: [
      'BNB',
      'BTC',
      'ETH',
      'USDT'
    ],
    assets: [
      'ADA',
      'ADX',
      'AION',
      'AMB',
      'APPC',
      'ARK',
      'ARN',
      'AST',
      'BAT',
      'BCC',
      'BCD',
      'BCPT',
      'BNB',
      'BNT',
      'BQX',
      'BRD',
      'BTC',
      'BTG',
      'BTS',
      'CDT',
      'CMT',
      'CND',
      'CTR',
      'DASH',
      'DGD',
      'DLT',
      'DNT',
      'EDO',
      'ELF',
      'ENG',
      'ENJ',
      'EOS',
      'ETC',
      'ETH',
      'EVX',
      'FUEL',
      'FUN',
      'GAS',
      'GTO',
      'GVT',
      'GXS',
      'HSR',
      'ICN',
      'ICX',
      'INS',
      'IOTA',
      'KMD',
      'KNC',
      'LEND',
      'LINK',
      'LRC',
      'LSK',
      'LTC',
      'LUN',
      'MANA',
      'MCO',
      'MDA',
      'MOD',
      'MTH',
      'MTL',
      'NAV',
      'NEBL',
      'NEO',
      'NULS',
      'OAX',
      'OMG',
      'OST',
      'POE',
      'POWR',
      'PPT',
      'QSP',
      'QTUM',
      'RCN',
      'RDN',
      'REQ',
      'RLC',
      'SALT',
      'SNGLS',
      'SNM',
      'SNT',
      'STORJ',
      'STRAT',
      'SUB',
      'TNB',
      'TNT',
      'TRIG',
      'TRX',
      'VEN',
      'VIB',
      'VIBE',
      'WABI',
      'WAVES',
      'WINGS',
      'WTC',
      'XLM',
      'XMR',
      'XRP',
      'XVG',
      'XZC',
      'YOYO',
      'ZEC',
      'ZRX'
    ],
    markets: [
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BNB',
          'GTO'
        ],
        precision: 0.00001
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BNB',
          'NULS'
        ],
        precision: 0.00001
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BNB',
          'BTC'
        ],
        precision: 1e-7
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'NULS'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'CTR'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'NEO'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'NULS'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'LINK'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'SALT'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'IOTA'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'ETC'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'AST',
          'ETH'
        ],
        precision: 1e-7
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'KNC'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'WTC'
        ],
        precision: 1e-7
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'SNGLS'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'EOS',
          'ETH'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'SNT'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'MCO'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 0.000001,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'USDT'
        ],
        precision: 0.01
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'OAX'
        ],
        precision: 1e-7
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'OMG'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'GAS'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BQX',
          'ETH'
        ],
        precision: 1e-7
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'WTC'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'QTUM'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BNT',
          'ETH'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'DNT',
          'ETH'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'ICN'
        ],
        precision: 1e-7
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'SNM'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'SNM'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'SNGLS'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BQX',
          'BTC'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'NEO'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'KNC'
        ],
        precision: 1e-7
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'STRAT'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'ZRX'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'QTUM'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'FUN'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'LTC'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'LINK'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 0.001,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'ETH'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'XVG'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'STRAT'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'ZRX'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'IOTA'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 0.001,
          unit: 'asset'
        },
        pair: [
          'BCC',
          'BTC'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'CTR',
          'ETH'
        ],
        precision: 1e-7
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'OMG'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'MCO'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'SALT'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'ADA',
          'BTC'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'ADA',
          'ETH'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'ADX',
          'BNB'
        ],
        precision: 0.00001
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'ADX',
          'BTC'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'ADX',
          'ETH'
        ],
        precision: 1e-7
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'AION',
          'BNB'
        ],
        precision: 0.00001
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'AION',
          'BTC'
        ],
        precision: 1e-7
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'AION',
          'ETH'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'AMB',
          'BNB'
        ],
        precision: 0.00001
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'AMB',
          'BTC'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'AMB',
          'ETH'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'APPC',
          'BNB'
        ],
        precision: 0.00001
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'APPC',
          'BTC'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'APPC',
          'ETH'
        ],
        precision: 1e-7
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'ARK',
          'BTC'
        ],
        precision: 1e-7
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'ARK',
          'ETH'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'ARN',
          'BTC'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'ARN',
          'ETH'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'AST',
          'BTC'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BAT',
          'BNB'
        ],
        precision: 0.00001
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BAT',
          'BTC'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BAT',
          'ETH'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 0.00001,
          unit: 'asset'
        },
        pair: [
          'BCC',
          'BNB'
        ],
        precision: 0.01
      },
      {
        minimalOrder: {
          amount: 0.001,
          unit: 'asset'
        },
        pair: [
          'BCC',
          'ETH'
        ],
        precision: 0.00001
      },
      {
        minimalOrder: {
          amount: 0.00001,
          unit: 'asset'
        },
        pair: [
          'BCC',
          'USDT'
        ],
        precision: 0.01
      },
      {
        minimalOrder: {
          amount: 0.001,
          unit: 'asset'
        },
        pair: [
          'BCD',
          'BTC'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 0.001,
          unit: 'asset'
        },
        pair: [
          'BCD',
          'ETH'
        ],
        precision: 0.00001
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BCPT',
          'BNB'
        ],
        precision: 0.00001
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BCPT',
          'BTC'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BCPT',
          'ETH'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BNB',
          'ETH'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BNT',
          'BTC'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BNB',
          'BRD'
        ],
        precision: 0.00001
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BRD',
          'BTC'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BRD',
          'ETH'
        ],
        precision: 1e-7
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'BTG'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BTG',
          'ETH'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BNB',
          'BTS'
        ],
        precision: 0.00001
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'BTS'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTS',
          'ETH'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'CDT'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'CDT',
          'ETH'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BNB',
          'CMT'
        ],
        precision: 0.00001
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'CMT'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'CMT',
          'ETH'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BNB',
          'CND'
        ],
        precision: 0.00001
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'CND'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'CND',
          'ETH'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 0.001,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'DASH'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 0.001,
          unit: 'asset'
        },
        pair: [
          'DASH',
          'ETH'
        ],
        precision: 0.00001
      },
      {
        minimalOrder: {
          amount: 0.001,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'DGD'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 0.001,
          unit: 'asset'
        },
        pair: [
          'DGD',
          'ETH'
        ],
        precision: 0.00001
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BNB',
          'DLT'
        ],
        precision: 0.00001
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'DLT'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'DLT',
          'ETH'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'DNT'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'EDO'
        ],
        precision: 1e-7
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'EDO',
          'ETH'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'ELF'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'ELF',
          'ETH'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'ENG'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'ENG',
          'ETH'
        ],
        precision: 1e-7
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'ENJ'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'ENJ',
          'ETH'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'EOS'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'ETC',
          'ETH'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'EVX'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'EVX'
        ],
        precision: 1e-7
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'FUEL'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'FUEL'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'FUN'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BNB',
          'VEN'
        ],
        precision: 0.0001
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'GTO'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'GTO'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'GVT'
        ],
        precision: 1e-7
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'GVT'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'GXS'
        ],
        precision: 1e-7
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'GXS'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'HSR'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'HSR'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'ICN'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BNB',
          'ICX'
        ],
        precision: 0.00001
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'ICX'
        ],
        precision: 1e-7
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'ICX'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'INS'
        ],
        precision: 1e-7
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'INS'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BNB',
          'IOTA'
        ],
        precision: 0.00001
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'KMD'
        ],
        precision: 1e-7
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'KMD'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'LEND'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'LEND'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'LRC'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'LRC'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BNB',
          'LSK'
        ],
        precision: 0.0001
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'LSK'
        ],
        precision: 1e-7
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'LSK'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 0.00001,
          unit: 'asset'
        },
        pair: [
          'BNB',
          'LTC'
        ],
        precision: 0.01
      },
      {
        minimalOrder: {
          amount: 0.001,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'LTC'
        ],
        precision: 0.00001
      },
      {
        minimalOrder: {
          amount: 0.00001,
          unit: 'asset'
        },
        pair: [
          'LTC',
          'USDT'
        ],
        precision: 0.01
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'LUN'
        ],
        precision: 1e-7
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'LUN'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'MANA'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'MANA'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BNB',
          'MCO'
        ],
        precision: 0.00001
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'MDA'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'MDA'
        ],
        precision: 1e-7
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'MOD'
        ],
        precision: 1e-7
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'MOD'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'MTH'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'MTH'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'MTL'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'MTL'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BNB',
          'NAV'
        ],
        precision: 0.00001
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'NAV'
        ],
        precision: 1e-7
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'NAV'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BNB',
          'NEBL'
        ],
        precision: 0.00001
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'NEBL'
        ],
        precision: 1e-7
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'NEBL'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 0.001,
          unit: 'asset'
        },
        pair: [
          'BNB',
          'NEO'
        ],
        precision: 0.001
      },
      {
        minimalOrder: {
          amount: 0.001,
          unit: 'asset'
        },
        pair: [
          'NEO',
          'USDT'
        ],
        precision: 0.001
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'OAX'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BNB',
          'OST'
        ],
        precision: 0.00001
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'OST'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'OST'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'POE'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'POE'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BNB',
          'POWR'
        ],
        precision: 0.00001
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'POWR'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'POWR'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'PPT'
        ],
        precision: 1e-7
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'PPT'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BNB',
          'QSP'
        ],
        precision: 0.00001
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'QSP'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'QSP'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BNB',
          'RCN'
        ],
        precision: 0.00001
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'RCN'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'RCN'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BNB',
          'RDN'
        ],
        precision: 0.00001
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'RDN'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'RDN'
        ],
        precision: 1e-7
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'REQ'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'REQ'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BNB',
          'RLC'
        ],
        precision: 0.00001
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'RLC'
        ],
        precision: 1e-7
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'RLC'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'SNT'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'STORJ'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'STORJ'
        ],
        precision: 1e-7
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'SUB'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'SUB'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'TNB'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'TNB'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'TNT'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'TNT'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BNB',
          'TRIG'
        ],
        precision: 0.00001
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'TRIG'
        ],
        precision: 1e-7
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'TRIG'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'TRX'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'TRX'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'VEN'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'VEN'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'VIB'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'VIBE'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'VIBE'
        ],
        precision: 1e-7
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'VIB'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BNB',
          'WABI'
        ],
        precision: 0.00001
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'WABI'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'WABI'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BNB',
          'WAVES'
        ],
        precision: 0.0001
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'WAVES'
        ],
        precision: 1e-7
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'WAVES'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'WINGS'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'WINGS'
        ],
        precision: 1e-7
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BNB',
          'WTC'
        ],
        precision: 0.0001
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BNB',
          'XLM'
        ],
        precision: 0.00001
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'XLM'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'XLM'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 0.001,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'XMR'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 0.001,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'XMR'
        ],
        precision: 0.00001
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'XRP'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'XRP'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'XVG'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 0.001,
          unit: 'asset'
        },
        pair: [
          'BNB',
          'XZC'
        ],
        precision: 0.001
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'XZC'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'XZC'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BNB',
          'YOYO'
        ],
        precision: 0.00001
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'YOYO'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 1,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'YOYO'
        ],
        precision: 1e-8
      },
      {
        minimalOrder: {
          amount: 0.001,
          unit: 'asset'
        },
        pair: [
          'BTC',
          'ZEC'
        ],
        precision: 0.000001
      },
      {
        minimalOrder: {
          amount: 0.001,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'ZEC'
        ],
        precision: 0.00001
      },
      {
        minimalOrder: {
          amount: 0.01,
          unit: 'asset'
        },
        pair: [
          'BNB',
          'USDT'
        ],
        precision: 0.0001
      },
      {
        minimalOrder: {
          amount: 0.00001,
          unit: 'asset'
        },
        pair: [
          'ETH',
          'USDT'
        ],
        precision: 0.01
      }
    ],
    requires: ['key', 'secret'],
    providesHistory: 'date',
    providesFullHistory: true,
    tid: 'tid',
    tradable: true,
  };
};

module.exports = Trader;
