var Kraken = require('kraken-api');
var moment = require('moment');
var util = require('../core/util');
var _ = require('lodash');
var log = require('../core/log');

var crypto_currencies = [
  "LTC",
  "XBT",
  "XRP",
  "ETH",
  "XDG",
  "XLM",
  "XRP"
];

var fiat_currencies = [
  "EUR",
  "GBP",
  "USD",
  "JPY"
];

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
  else
    return cryptoPrefix + value;
}

var Trader = function(config) {
  _.bindAll(this);

  if(_.isObject(config)) {
    this.key = config.key;
    this.secret = config.secret;
    this.currency = config.currency.toUpperCase()
    this.asset = config.asset.toUpperCase();
  }

  this.pair = addPrefix(this.asset) + addPrefix(this.currency);
  this.name = 'kraken';
  this.since = null;

  this.kraken = new Kraken(this.key, this.secret);
}

Trader.prototype.retry = function(method, args, err) {
  var wait = +moment.duration(10, 'seconds');
  log.debug(this.name, 'returned an error, retrying..', err);

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
};

Trader.prototype.getTrades = function(since, callback, descending) {
  var args = _.toArray(arguments);
  var process = function(err, trades) {
    if (err || !trades || trades.length === 0)
      return this.retry(this.getTrades, args, err);

    var parsedTrades = [];
    _.each(trades.result[this.pair], function(trade) {
      parsedTrades.push({
        date: parseInt(Math.round(trade[2]), 10),
        price: parseFloat(trade[0]),
        amount: parseFloat(trade[1])
      });
    }, this);

    if(descending)
      callback(null, parsedTrades.reverse());
    else
      callback(null, parsedTrades);
  };

  var reqData = {
    pair: this.pair
  };
  // This appears to not work correctly
  // skipping for now so we have the same
  // behaviour cross exchange.
  //
  // if(!_.isNull(this.since))
  //   reqData.since = this.since;
  this.kraken.api('Trades', reqData, _.bind(process, this));
};

Trader.prototype.getPortfolio = function(callback) {
  var args = _.toArray(arguments);
  var set = function(err, data) {

    if(_.isEmpty(data))
      err = 'no data';

    else if(!_.isEmpty(data.error))
      err = data.error;

    if (err || !data.result)
      return this.retry(this.getPortfolio, args, JSON.stringify(err));

    var assetAmount = parseFloat( data.result[addPrefix(this.asset)] );
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
    callback(err, portfolio);
  };

  this.kraken.api('Balance', {}, _.bind(set, this));
};

Trader.prototype.getFee = function(callback) {
  callback(false, 0.002);
};

Trader.prototype.getTicker = function(callback) {
  var set = function(err, data) {
    if(!err && _.isEmpty(data))
      err = 'no data';

    else if(!err && !_.isEmpty(data.error))
      err = data.error;

    if (err)
      return log.error('unable to get ticker', JSON.stringify(err));

    var result = data.result[this.pair];
    var ticker = {
      ask: result.a[0],
      bid: result.b[0]
    };
    callback(err, ticker);
  };

  this.kraken.api('Ticker', {pair: this.pair}, _.bind(set, this));
};


var roundAmount = function(amount) {
  // Prevent "You incorrectly entered one of fields."
  // because of more than 8 decimals.
  amount *= 100000000;
  amount = Math.floor(amount);
  amount /= 100000000;
  return amount;
};

Trader.prototype.addOrder = function(tradeType, amount, price, callback) {
  var args = _.toArray(arguments);

  amount = roundAmount(amount);
  log.debug(tradeType.toUpperCase(), amount, this.asset, '@', price, this.currency);

  var set = function(err, data) {
    if(!err && _.isEmpty(data))
      err = 'no data';
    else if(!err && !_.isEmpty(data.error))
      err = data.error;

    if(err)
      return this.retry(
        this.addOrder,
        args,
        'unable to ' + tradeType.toLowerCase() + ': ' + JSON.stringify(err)
      );

    var txid = data.result.txid[0];
    log.debug('added order with txid:', txid);

    callback(undefined, txid);
  };

  this.kraken.api('AddOrder', {
    pair: this.pair,
    type: tradeType.toLowerCase(),
    ordertype: 'limit',
    price: price,
    volume: amount.toString()
  }, _.bind(set, this));
};


Trader.prototype.getOrder = function(order, callback) {

  var get = function(err, data) {
    if(!err && _.isEmpty(data) && _.isEmpty(data.result))
      err = 'no data';

    else if(!err && !_.isEmpty(data.error))
      err = data.error;

    if(err)
      return log.error('Unable to get order', order, JSON.stringify(err));

    var price = parseFloat( data.result[ order ].price );
    var amount = parseFloat( data.result[ order ].vol_exec );
    var date = moment.unix( data.result[ order ].closetm );

    callback(undefined, {price, amount, date});
  }.bind(this);

  this.kraken.api('QueryOrders', {txid: order}, get);
}

Trader.prototype.buy = function(amount, price, callback) {
  this.addOrder('buy', amount, price, callback);
};

Trader.prototype.sell = function(amount, price, callback) {
  this.addOrder('sell', amount, price, callback);
};

Trader.prototype.checkOrder = function(order, callback) {
  var check = function(err, data) {
    if(_.isEmpty(data))
      err = 'no data';

    if(!_.isEmpty(data.error))
      err = data.error;

    if(err)
      return log.error('Unable to check order', order, JSON.stringify(err));

    var result = data.result[order];
    var stillThere = result.status === 'open' || result.status === 'pending';
    callback(err, !stillThere);
  };

  this.kraken.api('QueryOrders', {txid: order}, _.bind(check, this));
};

Trader.prototype.cancelOrder = function(order, callback) {
  var args = _.toArray(arguments);
  var cancel = function(err, data) {
    if(!err && _.isEmpty(data))
      err = 'no data';
    else if(!err && !_.isEmpty(data.error))
      err = data.error;

    if(err) {
      log.error('unable to cancel order', order, '(', err, JSON.stringify(err), ')');
      return this.retry(this.cancelOrder, args);
    }

    callback();
  };

  this.kraken.api('CancelOrder', {txid: order}, _.bind(cancel, this));
};

Trader.getCapabilities = function () {
  return {
    name: 'Kraken',
    slug: 'kraken',
    currencies: ['ETH', 'XBT', 'CAD', 'EUR', 'GBP', 'JPY', 'XRP', 'XDG', 'XLM', 'USD'],
    assets: ['ETH', 'LTC', 'XBT'],
    markets: [

      { pair: ['XBT', 'ETH'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['CAD', 'ETH'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['EUR', 'ETH'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['GBP', 'ETH'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['JPY', 'ETH'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['USD', 'ETH'], minimalOrder: { amount: 0.01, unit: 'asset' } },

      { pair: ['CAD', 'LTC'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['EUR', 'LTC'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['USD', 'LTC'], minimalOrder: { amount: 0.01, unit: 'asset' } },

      { pair: ['LTC', 'XBT'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['XDG', 'XBT'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['XLM', 'XBT'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['XRP', 'XBT'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['CAD', 'XBT'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['EUR', 'XBT'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['GBP', 'XBT'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['JPY', 'XBT'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['USD', 'XBT'], minimalOrder: { amount: 0.01, unit: 'asset' } }
    ],
    requires: ['key', 'secret'],
    providesHistory: false,
    tid: 'date'
  };
}

module.exports = Trader;
