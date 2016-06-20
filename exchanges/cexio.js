var CEXio = require('cexio'),
   moment = require('moment'),
    async = require('async'),
        _ = require('lodash'),
     util = require('../core/util'),
      log = require('../core/log');

var Trader = function(config) {
  this.user = config.username;
  this.key = config.key;
  this.secret = config.secret;
  this.currency = config.currency.toUpperCase();
  this.asset = config.asset.toUpperCase();
  this.pair = this.asset + '_' + this.currency;
  this.name = 'cex.io';

  this.cexio = new CEXio(
    this.pair,
    this.user,
    this.key,
    this.secret
  );

  _.bindAll(this);
}

Trader.prototype.getTrades = function(since, callback, descending) {
  var args = _.toArray(arguments);
  var process = function(err, trades) {
    if(err || !trades || trades.length === 0)
      return this.retry(this.getTrades, args, err);

    var f = parseFloat;

    if(descending)
      callback(null, trades);
    else
      callback(null, trades.reverse());
  }

  this.cexio.trades({}, _.bind(process, this));
}

Trader.prototype.buy = function(amount, price, callback) {
  // Prevent "You incorrectly entered one of fields."
  // because of more than 8 decimals.
  amount *= 100000000;
  amount = Math.floor(amount);
  amount /= 100000000;

  log.debug('BUY', amount, this.asset, '@', price, this.currency);

  var set = function(err, data) {
    if(err)
      return log.error('unable to buy:', err);
    if(data.error)
      return log.error('unable to buy:', data.error);

    log.debug('BUY order placed.  Order ID', data.id);
    callback(null, data.id);
  };

  this.cexio.place_order('buy', amount, price, _.bind(set, this));
}

Trader.prototype.sell = function(amount, price, callback) {
  // Prevent "You incorrectly entered one of fields."
  // because of more than 8 decimals.
  amount *= 100000000;
  amount = Math.floor(amount);
  amount /= 100000000;

  // test placing orders which will not be filled
  //price *= 10; price = price.toFixed(8);

  log.debug('SELL', amount, this.asset, '@', price, this.currency);

  var set = function(err, data) {
    if(err)
      return log.error('unable to sell:', err);
    if(data.error)
      return log.error('unable to sell:', data.error);

    log.debug('SELL order placed.  Order ID', data.id);
    callback(null, data.id);
  };

  this.cexio.place_order('sell', amount, price, _.bind(set, this));
}

Trader.prototype.retry = function(method, args, err) {
  var wait = +moment.duration(10, 'seconds');
  log.debug(this.name, 'returned an error, retrying..', err, 'waiting for', wait, 'ms');

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
}

Trader.prototype.getPortfolio = function(callback) {
  var args = _.toArray(arguments);
  var calculate = function(err, data) {
    if(err)
      return this.retry(this.getPortfolio, args, err);

    currency = parseFloat(data.BTC.available)
    if(parseFloat(data.BTC.orders)){
      currency -= parseFloat(data.BTC.orders)
    }
    assets = parseFloat(data.GHS.available);
    if( parseFloat(data.GHS.orders)){
	  assets -= parseFloat(data.GHS.orders);
    }

    var portfolio = [];
    portfolio.push({name: 'BTC', amount: currency});
    portfolio.push({name: 'GHS', amount: assets});
    callback(err, portfolio);
  }
  this.cexio.balance(_.bind(calculate, this));
}

Trader.prototype.getTicker = function(callback) {
  var set = function(err, data) {
    var ticker = {
      ask: data.ask,
      bid: data.bid
    };
    callback(err, ticker);
  }
  this.cexio.ticker(_.bind(set, this));
}

Trader.prototype.getFee = function(callback) {
  // cexio does currently don't take a fee on trades
  // TODO: isn't there an API call for this?
  callback(false, 0.002);
}

Trader.prototype.checkOrder = function(order, callback) {
  var check = function(err, result) {

    if(err)
      return callback(false, true);
    if(result.error)
      return callback(false, true);

    var exists = false;
    _.each(result, function(entry) {
      if(entry.id === order) {
        exists = true;
        return;
      }
    });
    callback(err, !exists);
  };

  this.cexio.open_orders(_.bind(check, this));
}

Trader.prototype.cancelOrder = function(order) {
  var check= function(err, result) {
    if(err)
      log.error('cancel order failed:', err);
    if(typeof(result) !== 'undefined' && result.error)
      log.error('cancel order failed:', result.error);
  }
  this.cexio.cancel_order(order, check);
}

module.exports = Trader;

