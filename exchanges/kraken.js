var Kraken = require('kraken-api');
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

  if (_.isObject(config)) {
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

module.exports = Trader;
