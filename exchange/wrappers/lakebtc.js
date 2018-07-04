var Lakebtc = require("lakebtc_nodejs");
var util = require('../core/util.js');
var _ = require('lodash');
var moment = require('moment');
var log = require('../core/log');

var Trader = function(config) {
  _.bindAll(this);
  if(_.isObject(config)) {
    this.key = config.key;
    this.secret = config.secret;
    this.clientID = config.username;
  }
  this.name = 'LakeBTC';
  this.balance;
  this.price;

  this.lakebtc = new Lakebtc(this.key, this.secret);
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
  // arguments after wait
  setTimeout(
    function() { method.apply(self, args) },
    wait
  );
}

Trader.prototype.getPortfolio = function(callback) {
  var set = function(err, data) {
    var portfolio = [];
    _.map(data.balance, function(amount, asset) {
	  portfolio.push({name: asset, amount: parseFloat(amount)});
    });
    callback(err, portfolio);
  }
  this.lakebtc.getAccountInfo(_.bind(set, this));
}

Trader.prototype.getTicker = function(callback) {
  this.lakebtc.ticker(callback);
}

Trader.prototype.getFee = function(callback) {
  callback(false, 0.002);
}

Trader.prototype.buy = function(amount, price, callback) {
  var set = function(err, result) {
    if(err || result.error)
      return log.error('unable to buy:', err, result);

    callback(null, result.id);
  };

  // TODO: fees are hardcoded here?
  amount *= 0.998; // remove fees
  // prevent: Ensure that there are no more than 4 digits in total.
  amount *= 10000;
  amount = Math.floor(amount);
  amount /= 10000;
  this.lakebtc.buyOrder(_.bind(set, this), [price, amount, 'USD']);
}

Trader.prototype.sell = function(amount, price, callback) {
  var set = function(err, result) {
    if(err || result.error)
      return log.error('unable to sell:', err, result);

    callback(null, result.id);
  };

  this.lakebtc.sell(_.bind(set, this), [price, amount, 'USD']);
}

Trader.prototype.checkOrder = function(order, callback) {
  var check = function(err, result) {
    var stillThere = _.find(result, function(o) { return o.id === order });
    callback(err, !stillThere);
  };

  this.lakebtc.getOrders(_.bind(check, this));
}

Trader.prototype.cancelOrder = function(order, callback) {
  var cancel = function(err, result) {
    if(err || !result.result)
      log.error('unable to cancel order', order, '(', err, result, ')');
  };

  this.lakebtc.cancelOrder(_.bind(cancel, this), [order]);
}

Trader.prototype.getTrades = function(since, callback, descending) {
  var args = _.toArray(arguments);
  var process = function(err, result) {
    if(err)
      return this.retry(this.getTrades, args);
    callback(null, descending ? result.reverse() : result);
  };
  since = since ? since.unix() : moment().subtract(5, 'minutes').unix();
  this.lakebtc.bctrades( _.bind(process, this), since);
}

Trader.getCapabilities = function () {
  return {
    name: 'LakeBTC',
    slug: 'lakebtc',
    currencies: ['USD'],
    assets: ['BTC'],
    markets: [
      {
        pair: ['USD', 'BTC'], minimalOrder: { amount: 1, unit: 'currency' }
      }
    ],
    requires: ['key', 'secret'],
    providesHistory: false,
    fetchTimespan: 60,
    tid: 'tid'
  };
}

module.exports = Trader;
