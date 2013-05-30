var MtGoxClient = require("mtgox-apiv2");
var util = require('../util.js');
var _ = require('underscore');
var log = require('../log.js');
var moment = require('moment');

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
  this.mtgox.add('bid', amount, price, function(err, result) {
    // if Mt. Gox is down or lagging
    if(err || result.result === 'error')
      log.error('unable to buy (', err, result, ')');

    callback(err, result.data);
  });
}

Trader.prototype.sell = function(amount, price, callback) {
  this.mtgox.add('ask', amount, price, function(err, result) {
    // if Mt. Gox is down or lagging
    if(err || result.result === 'error')
      log.error('unable to sell (', err, result, ')');

    callback(err, result.data);
  });
}

Trader.prototype.getTrades = function(since, callback) {
  if(since)
    since = util.toMicro(since);

  this.mtgox.fetchTrades(since, callback)
}

// if Mt. Gox errors we try the same call again after
// 5 seconds or half a second if there is haste
Trader.prototype.retry = function(method, callback, haste) {
  var wait = +moment.duration(haste ? 0.5 : 5, 'seconds');
  log.debug(this.name, 'returned an error, retrying..');
  setTimeout(
    _.bind(method, this),
    wait,
    _.bind(callback, this)
  );
}

// calls callback with the following data structure:
//
// [
//  { name: 'BTC', amount: 10.12413123},
//  { name: 'USD', amount: 500.0241},
//  { name: 'EUR', amount: 0},
// ]
Trader.prototype.getPortfolio = function(callback) {
  var calculate = function(err, result) {
    if(err)
      return this.retry(this.mtgox.info, calculate);

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
  var calculate = function(err, result) {
    if(err)
      return this.retry(this.mtgox.info, calculate);

    // convert the %
    var fee = result.data.Trade_Fee / 100;
    callback(null, fee);
  };

  this.mtgox.info(_.bind(calculate, this));
}

Trader.prototype.checkOrder = function(order, callback) {
  // we can't just request the order id
  // @link https://bitbucket.org/nitrous/mtgox-api/#markdown-header-moneyorderresult
  var check = function(err, result) {
    if(err)
      return this.retry(this.mtgox.orders, check);
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
  var set = function(err, result) {
    if(err)
      return this.retry(this.mtgox.ticker, set);

    var ticker = {
      bid: result.data.buy.value,
      ask: result.data.sell.value
    }
    callback(err, ticker);
  };

  this.mtgox.ticker(_.bind(set, this));
}

module.exports = Trader;