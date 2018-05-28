// HERE FOR HISTORICAL PURPOSES

var MtGoxClient = require("mtgox-apiv2");
var _ = require('lodash');
var moment = require('moment');
var util = require('../core/util.js');
var log = require('../core/log');

var Trader = function(config) {
  if(_.isObject(config)) {
    this.key = config.key;
    this.secret = config.secret;
    this.currency = config.currency || 'USD';

    this.pair = 'BTC' + this.currency;
  }
  this.name = 'Mt. Gox';

  _.bindAll(this);

  this.mtgox = new MtGoxClient(this.key, this.secret, this.pair);
}

Trader.prototype.buy = function(amount, price, callback) {
  var process = function(err, result) {
    this.checkUnauthorized(err);
    // if Mt. Gox is down or lagging
    if(err || result.result === 'error')
      log.error('unable to buy (', err, result, ')');

    callback(null, result.data);
  };
  this.mtgox.add('bid', amount, price, _.bind(process, this));
}

Trader.prototype.sell = function(amount, price, callback) {
  var process = function(err, result) {
    this.checkUnauthorized(err);
    // if Mt. Gox is down or lagging
    if(err || result.result === 'error')
      log.error('unable to sell (', err, result, ')');

    callback(null, result.data);
  };
  this.mtgox.add('ask', amount, price, _.bind(process, this));
}

Trader.prototype.getTrades = function(since, callback, descending) {
  if(since && !_.isNumber(since))
    since = util.toMicro(since);

  var args = _.toArray(arguments);
  this.mtgox.fetchTrades(since, _.bind(function(err, trades) {
    if (err || !trades)
      return this.retry(this.getTrades, args);

    trades = trades.data;
    if (trades.length === 0)
      return this.retry(this.getTrades, args);

    if(descending)
      callback(false, trades.reverse());
    else
      callback(false, trades);
  }, this));
}

// if the exchange errors we try the same call again after
// waiting 10 seconds
Trader.prototype.retry = function(method, args) {
  var wait = +moment.duration(10, 'seconds');
  log.debug(this.name, 'returned an error, retrying..');

  var self = this;

  // make sure the callback (and any other fn)
  // is bound to Trader
  _.each(args, function(arg, i) {
    if(_.isFunction(arg))
      args[i] = _.bind(arg, self);
  });

  // run the failed method again with the same
  // arguments after wait.
  setTimeout(
    function() { method.apply(self, args) },
    wait
  );
}

Trader.prototype.checkUnauthorized = function(err) {
  if(err && err.message === 'Request failed with 403')
    util.die('It appears your ' + this.name + ' API key and secret are incorrect');
}

// calls callback with the following data structure:
//
// [
//  { name: 'BTC', amount: 10.12413123},
//  { name: 'USD', amount: 500.0241},
//  { name: 'EUR', amount: 0},
// ]
Trader.prototype.getPortfolio = function(callback) {
  var args = _.toArray(arguments);
  var calculate = function(err, result) {
    this.checkUnauthorized(err);
    if(err)
      return this.retry(this.getPortfolio, args);

    if(!('Wallets' in result.data))
      log.error('unable to get portfolio, do I have get_info rights?');

    var assets = [];
    _.each(result.data.Wallets, function(wallet, name) {
      var amount = parseFloat(wallet.Balance.value);
      assets.push({name: name, amount: amount});
    });
    callback(null, assets);
  };

  this.mtgox.info(_.bind(calculate, this));
}

Trader.prototype.getFee = function(callback) {
  var args = _.toArray(arguments);
  var calculate = function(err, result) {
    this.checkUnauthorized(err);
    if(err)
      return this.retry(this.getFee, args);

    // convert the %
    var fee = result.data.Trade_Fee / 100;
    callback(null, fee);
  };

  this.mtgox.info(_.bind(calculate, this));
}

Trader.prototype.checkOrder = function(order, callback) {
  var args = _.toArray(arguments);
  // we can't just request the order id
  // @link https://bitbucket.org/nitrous/mtgox-api/#markdown-header-moneyorderresult
  var check = function(err, result) {
    if(err)
      return this.retry(this.checkOrder, args);

    var stillThere = _.find(result.data, function(o) { return o.oid === order });
    callback(null, !stillThere);
  };

  this.mtgox.orders(_.bind(check, this));
}

Trader.prototype.cancelOrder = function(order) {
  var cancel = function(err, result) {
    if(err || result.result !== 'succes')
      log.error('unable to cancel order', order, '(', err, result, ')');
  };

  this.mtgox.cancel(order, _.bind(cancel, this));
}

Trader.prototype.getTicker = function(callback) {
  var args = _.toArray(arguments);
  var set = function(err, result) {
    if(err)
      return this.retry(this.getTicker, args);

    var ticker = {
      bid: result.data.buy.value,
      ask: result.data.sell.value
    }
    callback(err, ticker);
  };

  this.mtgox.ticker(_.bind(set, this));
}

Trader.getCapabilities = function () {
  return {};
  // ---- Keeping this here for historical purposes. ----
  // {
  //
  //   name: 'MtGox',
  //   slug: 'mtgox',
  //   direct: true,
  //   infinityOrder: true,
  //   currencies: [
  //     'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'CHF', 'CNY',
  //     'DKK', 'HKD', 'PLN', 'RUB', 'SGD', 'THB'
  //   ],
  //   assets: ['BTC'],
  //   markets: [
  //     { pair: ['USD', 'BTC'], minimalOrder: { amount: 0.01, unit: 'asset' } },
  //     { pair: ['EUR', 'BTC'], minimalOrder: { amount: 0.01, unit: 'asset' } },
  //     { pair: ['GBP', 'BTC'], minimalOrder: { amount: 0.01, unit: 'asset' } },
  //     { pair: ['AUD', 'BTC'], minimalOrder: { amount: 0.01, unit: 'asset' } },
  //     { pair: ['CAD', 'BTC'], minimalOrder: { amount: 0.01, unit: 'asset' } },
  //     { pair: ['CHF', 'BTC'], minimalOrder: { amount: 0.01, unit: 'asset' } },
  //     { pair: ['CNY', 'BTC'], minimalOrder: { amount: 0.01, unit: 'asset' } },
  //     { pair: ['DKK', 'BTC'], minimalOrder: { amount: 0.01, unit: 'asset' } },
  //     { pair: ['HKD', 'BTC'], minimalOrder: { amount: 0.01, unit: 'asset' } },
  //     { pair: ['PLN', 'BTC'], minimalOrder: { amount: 0.01, unit: 'asset' } },
  //     { pair: ['RUB', 'BTC'], minimalOrder: { amount: 0.01, unit: 'asset' } },
  //     { pair: ['SGD', 'BTC'], minimalOrder: { amount: 0.01, unit: 'asset' } },
  //     { pair: ['THB', 'BTC'], minimalOrder: { amount: 0.01, unit: 'asset' } }
  //   ],
  //   requires: ['key', 'secret'],
  //   providesHistory: false
  // }
}

module.exports = Trader;

