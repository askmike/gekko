var Kraken = require('kraken-api');
var moment = require('moment');
var util = require('../core/util');
var _ = require('lodash');
var log = require('../core/log');

var crypto_currencies = [
  "LTC",
  "NMC",
  "XBT",
  "XVN",
  "XRP"
];

var fiat_currencies = [
  "EUR",
  "KRW",
  "USD"
];

// Method to check if asset/currency is a crypto currency
var isCrypto = function(value) {
  return _.contains(crypto_currencies, value);
};

// Method to check if asset/currency is a fiat currency
var isFiat = function(value) {
  return _.contains(fiat_currencies, value);
};

var Trader = function(config) {
  _.bindAll(this);

  // Default currency / asset
  this.currency = "EUR";
  this.asset = "XBT";

  if(_.isObject(config)) {
    this.key = config.key;
    this.secret = config.secret;
    this.currency = config.currency.toUpperCase();
    this.asset = config.asset.toUpperCase();
  }

  this.setAssetPair();
  this.name = 'kraken';
  this.since = null;

  this.kraken = new Kraken(this.key, this.secret);
}

Trader.prototype.setAssetPair = function() {
  var assetPrefix = "X";
  var currencyPrefix = "Z";

  if (isFiat(this.asset)) {
    assetPrefix = "Z";
  }
  if (isCrypto(this.currency)) {
    currencyPrefix = "X";
  }

  this.pair = assetPrefix + this.asset + currencyPrefix + this.currency;
};

Trader.prototype.retry = function(method, args, err) {
  var wait = +moment.duration(10, 'seconds');
  log.debug(this.name, 'returned an error, retrying..', err);

  if (!_.isFunction(method)) {
    log.error(this.name, 'failed to retry, no method supplied.');
    return;
  }

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

    this.since = trades.result.last;

    if (descending)
      callback(null, parsedTrades.reverse());
    else
      callback(null, parsedTrades);
  };

  var reqData = {
    pair: this.pair
  };
  if (!_.isNull(this.since))
    reqData.since = this.since;

  this.kraken.api('Trades', reqData, _.bind(process, this));
};

Trader.prototype.getPortfolio = function(callback) {
  var args = _.toArray(arguments);
  var set = function(err, data) {
    if (err || !_.isEmpty(data.error))
      return this.retry(this.getPortfolio, args, JSON.stringify(data.error));

    var portfolio = [];
    _.each(data.result, function(amount, asset) {
      portfolio.push({name: asset.substr(1), amount: parseFloat(amount)});
    });
    callback(err, portfolio);
  };

  this.kraken.api('Balance', {}, _.bind(set, this));
};

Trader.prototype.getFee = function(callback) {
  callback(false, 0.002);
};

Trader.prototype.getTicker = function(callback) {
  var set = function(err, data) {
    if (err || !_.isEmpty(data.error))
      return log.error('unable to get ticker', JSON.stringify(data.error));

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
  amount = roundAmount(amount);
  log.debug(tradeType.toUpperCase(), amount, this.asset, '@', price, this.currency);

  var set = function(err, data) {
    if (err || !_.isEmpty(data.error))
      return log.error('unable to', tradeType.toLowerCase(), JSON.stringify(data.error));

    var txid = data.result.txid[0];
    log.debug('added order with txid:', txid);

    callback(txid);
  };

  this.kraken.api('AddOrder', {
    pair: this.pair,
    type: tradeType.toLowerCase(),
    ordertype: 'limit',
    price: price,
    volume: amount.toString()
  }, _.bind(set, this));
};

Trader.prototype.buy = function(amount, price, callback) {
  this.addOrder('buy', amount, price, callback);
};

Trader.prototype.sell = function(amount, price, callback) {
  this.addOrder('sell', amount, price, callback);
};

Trader.prototype.checkOrder = function(order, callback) {
  var check = function(err, data) {
    if (err || !_.isEmpty(data.error))
      return log.error('unable to check order', order, JSON.stringify(data.error));

    var result = data.result[order];
    var stillThere = result.status === 'open' || result.status === 'pending';
    callback(err, !stillThere);
  };

  this.kraken.api('QueryOrders', {txid:order}, _.bind(check, this));
};

Trader.prototype.cancelOrder = function(order) {
  var cancel = function(err, data) {
    if (err || !_.isEmpty(data.error))
      log.error('unable to cancel order', order, '(', err, JSON.stringify(data.error), ')');
  };

  this.kraken.api('CancelOrder', {txid: order}, _.bind(cancel, this));
};

module.exports = Trader;
