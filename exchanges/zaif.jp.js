var Zaif = require("zaif.jp");
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
  this.name = 'Zaif';
  this.balance;
  this.price;

  this.zaif = Zaif.createPrivateApi(this.key, this.secret, 'user agent is node-zaif');
  this.api = Zaif.PublicApi;
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
  var set = function(data) {
    var portfolio = [];
    _.each(data.funds, function(amount, asset) {
//      if(asset.indexOf('available') !== -1) {
        asset = asset.substr(0, 3).toUpperCase();
        portfolio.push({name: asset, amount: parseFloat(amount)});
//      }
    });
    callback(err, portfolio);
  }
  this.zaif.getInfo().then(_.bind(set, this));
}

Trader.prototype.getTicker = function(callback) {
  this.api.ticker('btc_jpy').then(callback);
}

Trader.prototype.getFee = function(callback) {
    var makerFee = 0.0;
    callback(false, makerFee / 100);
}

Trader.prototype.buy = function(amount, price, callback) {
  var set = function(result) {
    if(!result)
      return log.error('unable to buy:', result);

    callback(null, result.order_id);
  };

  // TODO: fees are hardcoded here?
//  amount *= 0.995; // remove fees
  // prevent: Ensure that there are no more than 8 digits in total.
  amount *= 100000000;
  amount = Math.floor(amount);
  amount /= 100000000;
  this.zaif.trade('bid', price, amount).then(_.bind(set, this));
}

Trader.prototype.sell = function(amount, price, callback) {
  var set = function(result) {
    if(!result)
      return log.error('unable to sell:', result);

    callback(null, result.order_id);
  };

  this.zaif.trade('ask', price, amount).then(_.bind(set, this));
}

Trader.prototype.checkOrder = function(order, callback) {
  var check = function(result) {
    var stillThere = (order in result);
    callback(null, !stillThere);
  };

  this.zaif.activeorders().then(_.bind(check, this));
}

Trader.prototype.cancelOrder = function(order, callback) {
  var cancel = function(result) {
    if(!result)
      log.error('unable to cancel order', order, '(', result, ')');
  };

  this.zaif.cancelorder(order).then(_.bind(cancel, this));
}

Trader.prototype.getTrades = function(since, callback, descending) {
  var args = _.toArray(arguments);
  var process = function(result) {
    if(!result)
      return this.retry(this.getTrades, args);

    callback(null, result.reverse());
  };

  this.api.trades('btc_jpy').then(_.bind(process, this));
}

Trader.getCapabilities = function () {
  return {
    name: 'Zaif.jp',
    slug: 'zaif.jp',
    currencies: ['JPY'],
    assets: ['BTC'],
    markets: [
      {
        pair: ['JPY', 'BTC'], minimalOrder: { amount: 1, unit: 'currency' }
      }
    ],
    requires: ['key', 'secret', 'username'],
    providesHistory: false,
    fetchTimespan: 60,
    tid: 'tid'
  };
}

module.exports = Trader;