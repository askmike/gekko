const Kraken = require('kraken-api-es5');
const moment = require('moment');
const _ = require('lodash');

const util = require('../core/util');
const Errors = require('../core/error');
const log = require('../core/log');

var crypto_currencies = [
  "XBT",
  "DASH",
  "EOS",
  "ETC",
  "ETH",
  "GNO",
  "ICN",
  "LTC",
  "MLN",
  "REP",
  "USDT",
  "XDG",
  "XLM",
  "XMR",
  "XRP",
  "ZEC",
  "BCH"
];

var fiat_currencies = [
  "EUR",
  "GBP",
  "USD",
  "JPY",
  "CAD",
];

var assets_without_prefix = [
  'BCH',
  'DASH',
  'EOS',
  'GNO',
  'USDT'
]

// Method to check if asset/currency is a crypto currency
var isCrypto = function(value) {
  return _.contains(crypto_currencies, value);
};

// Method to check if asset/currency is a fiat currency
var isFiat = function(value) {
  return _.contains(fiat_currencies, value);
};

var addPrefix = function(value) {
  var fiatPrefix = "Z";
  var cryptoPrefix = "X";

  if(isFiat(value))
    return fiatPrefix + value;
  else if(isCrypto(value))
    return cryptoPrefix + value;
  else
    return value;
}

// Some currencies in Kraken don't use the prefix, not clearly documented
var getAssetPair = function(asset, currency) {
  if (asset === 'USDT')
    return 'USDTZUSD'; // Yet another kraken inconsistency

  if (_.contains(assets_without_prefix, asset))
    return asset + currency;
  else
    return addPrefix(asset) + addPrefix(currency);
}

var Trader = function(config) {
  _.bindAll(this);

  if(_.isObject(config)) {
    this.key = config.key;
    this.secret = config.secret;
    this.currency = config.currency.toUpperCase()
    this.asset = config.asset.toUpperCase();
  }

  this.pair = getAssetPair(this.asset, this.currency);
  this.name = 'kraken';
  this.since = null;

  this.kraken = new Kraken(
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
  minTimeout: 10 * 1000,
  maxTimeout: 30 * 1000
};

var recoverableErrors = new RegExp(/(SOCKETTIMEDOUT|TIMEDOUT|CONNRESET|CONNREFUSED|NOTFOUND|API:Rate limit exceeded|API:Invalid nonce|Service:Unavailable|Request timed out|Response code 525|Response code 520|Response code 504|Response code 502)/)

Trader.prototype.processError = function(funcName, error) {
  if (!error) return undefined;

  if (!error.message.match(recoverableErrors)) {
    log.error(`[kraken.js] (${funcName}) returned an irrecoverable error: ${error.message}`);
    return new Errors.AbortError('[kraken.js] ' + error.message);
  }

  log.debug(`[kraken.js] (${funcName}) returned an error, retrying: ${error.message}`);
  return new Errors.RetryError('[kraken.js] ' + error.message);
};

Trader.prototype.handleResponse = function(funcName, callback) {
  return (error, body) => {
    if(!error) {
      if(_.isEmpty(body) || !body.result)
        error = new Error('NO DATA WAS RETURNED');

      else if(!_.isEmpty(body.error))
        error = new Error(body.error);
    }

    return callback(this.processError(funcName, error), body);
  }
};

Trader.prototype.getTrades = function(since, callback, descending) {
  var startTs = since ? moment(since).valueOf() : null;

  var processResults = function(err, trades) {
    if (err) return callback(err);

    var parsedTrades = [];
    _.each(trades.result[this.pair], function(trade) {
      // Even when you supply 'since' you can still get more trades than you asked for, it needs to be filtered
      if (_.isNull(startTs) || startTs < moment.unix(trade[2]).valueOf()) {
        parsedTrades.push({
          tid: moment.unix(trade[2]).valueOf() * 1000000,
          date: parseInt(Math.round(trade[2]), 10),
          price: parseFloat(trade[0]),
          amount: parseFloat(trade[1])
        });
      }
    }, this);

    if(descending)
      callback(undefined, parsedTrades.reverse());
    else
      callback(undefined, parsedTrades);
  };

  let reqData = {
    pair: this.pair
  };

  if(since) {
    // Kraken wants a tid, which is found to be timestamp_ms * 1000000 in practice. No clear documentation on this though
    reqData.since = startTs * 1000000;
  }

  let handler = (cb) => this.kraken.api('Trades', reqData, this.handleResponse('getTrades', cb));
  util.retryCustom(retryForever, _.bind(handler, this), _.bind(processResults, this));
};

Trader.prototype.getPortfolio = function(callback) {
  console.log('getPortfolio');
  var setBalance = function(err, data) {
    console.log('aa', arguments);
    if(err) return callback(err);
    log.debug('[kraken.js] entering "setBalance" callback after kraken-api call, data:' , data);

    // When using the prefix-less assets, you remove the prefix from the assset but leave
    // it on the curreny in this case. An undocumented Kraken quirk.
    var assetId = _.contains(assets_without_prefix, this.asset) ? this.asset : addPrefix(this.asset);
    var assetAmount = parseFloat( data.result[assetId] );
    var currencyAmount = parseFloat( data.result[addPrefix(this.currency)] );

    if(!_.isNumber(assetAmount) || _.isNaN(assetAmount)) {
      log.error(`Kraken did not return portfolio for ${this.asset}, assuming 0.`);
      assetAmount = 0;
    }

    if(!_.isNumber(currencyAmount) || _.isNaN(currencyAmount)) {
      log.error(`Kraken did not return portfolio for ${this.currency}, assuming 0.`);
      currencyAmount = 0;
    }

    var portfolio = [
      { name: this.asset, amount: assetAmount },
      { name: this.currency, amount: currencyAmount }
    ];

    return callback(undefined, portfolio);
  };

  let handler = (cb) => this.kraken.api('Balance', {}, this.handleResponse('getPortfolio', cb));
  util.retryCustom(retryForever, _.bind(handler, this), _.bind(setBalance, this));
};

// This assumes that only limit orders are being placed with standard assets pairs
// It does not take into account volume discounts.
// Base maker fee is 0.16%, taker fee is 0.26%.
Trader.prototype.getFee = function(callback) {
  const makerFee = 0.16;
  callback(undefined, makerFee / 100);
};

Trader.prototype.getTicker = function(callback) {
  var setTicker = function(err, data) {
    if (err) return callback(err);

    var result = data.result[this.pair];
    var ticker = {
      ask: result.a[0],
      bid: result.b[0]
    };
    callback(undefined, ticker);
  };

  let reqData = {pair: this.pair}

  let handler = (cb) => this.kraken.api('Ticker', reqData, this.handleResponse('getTicker', cb));
  util.retryCustom(retryForever, _.bind(handler, this), _.bind(setTicker, this));
};

Trader.prototype.roundAmount = function(amount) {
  // Prevent "You incorrectly entered one of fields."
  // because of more than 8 decimals.
  // Specific precision by pair https://blog.kraken.com/post/1278/announcement-reducing-price-precision-round-2

  var precision = 100000000;
  var parent = this;
  var market = Trader.getCapabilities().markets.find(function(market){ return market.pair[0] === parent.currency && market.pair[1] === parent.asset });

  if(Number.isInteger(market.precision))
    precision = Math.pow(10, market.precision);

  amount *= precision;
  amount = Math.floor(amount);
  amount /= precision;
  return amount;
};

Trader.prototype.addOrder = function(tradeType, amount, price, callback) {
  amount = this.roundAmount(amount);
  price = this.roundAmount(price); // but the link talks about rounding price... And I had the bug

  log.debug('[kraken.js] (addOrder)', tradeType.toUpperCase(), amount, this.asset, '@', price, this.currency);

  var setOrder = function(err, data) {
    if(err) return callback(err);
    
    var txid = data.result.txid[0];
    log.debug('[kraken.js] (addOrder) added order with txid:', txid);

    callback(undefined, txid);
  };

  let reqData = {
    pair: this.pair,
    type: tradeType.toLowerCase(),
    ordertype: 'limit',
    price: price,
    volume: amount.toString()
  };

  let handler = (cb) => this.kraken.api('AddOrder', reqData, this.handleResponse('addOrder', cb));
  util.retryCustom(retryCritical, _.bind(handler, this), _.bind(setOrder, this));
};


Trader.prototype.getOrder = function(order, callback) {
  var getOrder = function(err, data) {
    if(err) return callback(err);

    var price = parseFloat( data.result[ order ].price );
    var amount = parseFloat( data.result[ order ].vol_exec );
    var date = moment.unix( data.result[ order ].closetm );

    callback(undefined, {price, amount, date});
  };

  let reqData = {txid: order};
  let handler = (cb) => this.kraken.api('QueryOrders', reqData, this.handleResponse('getOrder', cb));
  util.retryCustom(retryCritical, _.bind(handler, this), _.bind(getOrder, this));
}

Trader.prototype.buy = function(amount, price, callback) {
  this.addOrder('buy', amount, price, callback);
};

Trader.prototype.sell = function(amount, price, callback) {
  this.addOrder('sell', amount, price, callback);
};

Trader.prototype.checkOrder = function(order, callback) {
  var check = function(err, data) {
    if(err) return callback(err);

    var result = data.result[order];
    var stillThere = result.status === 'open' || result.status === 'pending';
    callback(undefined, !stillThere);
  };

  let reqData = {txid: order};
  let handler = (cb) => this.kraken.api('QueryOrders', reqData, this.handleResponse('checkOrder', cb));
  util.retryCustom(retryCritical, _.bind(handler, this), _.bind(check, this));
};

Trader.prototype.cancelOrder = function(order, callback) {
  let reqData = {txid: order};
  let handler = (cb) => this.kraken.api('CancelOrder', reqData, this.handleResponse('cancelOrder', cb));
  util.retryCustom(retryForever, _.bind(handler, this), callback);
};

Trader.getCapabilities = function () {
  return {
    name: 'Kraken',
    slug: 'kraken',
    currencies: ['CAD', 'EUR', 'GBP', 'JPY', 'USD', 'XBT', 'ETH'],
    assets: ['XBT', 'LTC', 'GNO', 'ICN', 'MLN', 'REP', 'XDG', 'XLM', 'XMR', 'XRP', 'ZEC', 'ETH', 'BCH', 'DASH', 'EOS', 'ETC', 'USDT'],
    markets: [
      //Tradeable againt ETH
      { pair: ['XBT', 'ETH'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 5 },
      { pair: ['CAD', 'ETH'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 2 },
      { pair: ['EUR', 'ETH'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 2 },
      { pair: ['GBP', 'ETH'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['JPY', 'ETH'], minimalOrder: { amount: 1, unit: 'asset' }, precision: 0 },
      { pair: ['USD', 'ETH'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 2 },

      //Tradeable against LTC
      { pair: ['XBT', 'LTC'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 6 },
      { pair: ['EUR', 'LTC'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 2 },
      { pair: ['USD', 'LTC'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 2 },

      //Tradeable against BCH
      { pair: ['USD', 'BCH'], minimalOrder: { amount: 0.1, unit: 'asset' }, precision: 1 },
      { pair: ['EUR', 'BCH'], minimalOrder: { amount: 0.1, unit: 'asset' }, precision: 1 },
      { pair: ['XBT', 'BCH'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 5 },

      //Tradeable against DASH
      { pair: ['USD', 'DASH'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 2 },
      { pair: ['EUR', 'DASH'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 2 },
      { pair: ['XBT', 'DASH'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 5 },

      //Tradeable against EOS
      { pair: ['USD', 'EOS'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['EUR', 'EOS'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['XBT', 'EOS'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 7 },
      { pair: ['ETH', 'EOS'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 6 },

      //Tradeable against ETC
      { pair: ['USD', 'ETC'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 3 },
      { pair: ['EUR', 'ETC'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 3 },
      { pair: ['XBT', 'ETC'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 6 },
      { pair: ['ETH', 'ETC'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 5 },

      //Tradeable against GNO
      { pair: ['USD', 'GNO'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['EUR', 'GNO'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['XBT', 'GNO'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 5 },
      { pair: ['ETH', 'GNO'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 4 },

      //Tradeable against ICN
      { pair: ['XBT', 'ICN'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 7 },
      { pair: ['ETH', 'ICN'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 6 },

      //Tradeable against MLN
      { pair: ['XBT', 'MLN'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 6 },
      { pair: ['ETH', 'MLN'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 5 },

      //Tradeable against REP
      { pair: ['USD', 'REP'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['EUR', 'REP'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 3 },
      { pair: ['XBT', 'REP'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 6 },
      { pair: ['ETH', 'REP'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 5 },

      //Tradeable against XDG
      { pair: ['XBT', 'XDG'], minimalOrder: { amount: 0.01, unit: 'asset' } },

      //Tradeable against XLM
      { pair: ['USD', 'XLM'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['EUR', 'XLM'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['XBT', 'XLM'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 8 },

      //Tradeable against XMR
      { pair: ['USD', 'XMR'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 2 },
      { pair: ['EUR', 'XMR'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 2 },
      { pair: ['XBT', 'XMR'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 6 },

      //Tradeable against XRP
      { pair: ['USD', 'XRP'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 5 },
      { pair: ['EUR', 'XRP'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 5 },
      { pair: ['XBT', 'XRP'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 8 },
      { pair: ['CAD', 'XRP'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['JPY', 'XRP'], minimalOrder: { amount: 0.01, unit: 'asset' } },

      //Tradeable against ZEC
      { pair: ['USD', 'ZEC'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 2 },
      { pair: ['EUR', 'ZEC'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 2 },
      { pair: ['XBT', 'ZEC'], minimalOrder: { amount: 0.01, unit: 'asset' }, precision: 5 },

      //Tradeable against XBT
      { pair: ['CAD', 'XBT'], minimalOrder: { amount: 0.1, unit: 'asset' }, precision: 1 },
      { pair: ['EUR', 'XBT'], minimalOrder: { amount: 0.1, unit: 'asset' }, precision: 1 },
      { pair: ['GBP', 'XBT'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['JPY', 'XBT'], minimalOrder: { amount: 1, unit: 'asset' }, precision: 0 },
      { pair: ['USD', 'XBT'], minimalOrder: { amount: 0.1, unit: 'asset' }, precision: 1 },

      //Tradeable against USDT
      { pair: ['USD', 'USDT'], minimalOrder: { amount: 0.1, unit: 'asset' }, precision: 2 },
    ],
    requires: ['key', 'secret'],
    providesHistory: 'date',
    providesFullHistory: true,
    tid: 'date',
    tradable: true
  };
}

module.exports = Trader;
