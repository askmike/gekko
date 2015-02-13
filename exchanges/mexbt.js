var Mexbt = require("mexbt");
var util = require('../core/util.js');
var _ = require('lodash');
var moment = require('moment');
var log = require('../core/log');

var Trader = function(config) {
  _.bindAll(this);
  if(_.isObject(config)) {
    this.key = config.key;
    this.secret = config.secret;
    this.userId = config.username;
    this.pair = config.asset || this.currency;
  }
  this.name = 'meXBT';
  this.mexbt = new Mexbt(this.key, this.secret, this.userId);
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
    _.each(data.currencies, function(balanceInfo) {
      portfolio.push({name: balanceInfo.name, amount: balanceInfo.balance});
    });
    callback(err, portfolio);
  }
  this.mexbt.accountBalance(_.bind(set, this));
}

Trader.prototype.getTicker = function(callback) {
  this.mexbt.ticker(callback);
}

Trader.prototype.getFee = function(callback) {
  var set = function(err, data) {
    if(err)
      callback(err);

    callback(false, data.fee);
  }
  this.mexbt.getTradingFee({amount: 1, type: 'limit'}, _.bind(set, this));
}

Trader.prototype.buy = function(amount, price, callback) {
  var set = function(err, result) {
    if(err || result.error)
      return log.error('unable to buy:', err, result);

    callback(null, result.serverOrderId);
  };

  this.mexbt.createOrder({amount: amount, price: price, side: 'buy', type: 'limit'}, _.bind(set, this));
}

Trader.prototype.sell = function(amount, price, callback) {
  var set = function(err, result) {
    if(err || result.error)
      return log.error('unable to sell:', err, result);

    callback(null, result.serverOrderId);
  };

  this.mexbt.createOrder({amount: amount, price: price, side: 'sell', type: 'limit'}, _.bind(set, this));
}

Trader.prototype.checkOrder = function(order, callback) {
  var currentPair = this.pair;

  var check = function(err, result) {
    var ordersForPair = _.find(result, function(o) { return o.ins === currentPair});
    var stillThere = _.find(ordersForPair.openOrders, function(o) { return o.ServerOrderId === order });
    callback(err, !stillThere);
  };

  this.mexbt.accountOrders(_.bind(check, this));
}

Trader.prototype.cancelOrder = function(order, callback) {
  var cancel = function(err, result) {
    if(err || !result)
      log.error('unable to cancel order', order, '(', err, result, ')');
  };

  this.mexbt.cancelOrder({id: order}, _.bind(cancel, this));
}

Trader.prototype.getTrades = function(since, callback, descending) {
  var args = _.toArray(arguments);
  var process = function(err, result) {
    //console.log(result.trades);
    if(err)
      return this.retry(this.getTrades, args);
    trades = _.map(result.trades, function (t) {
      return {tid: t.tid, price: t.px, date: t.unixtime, amount: t.qty};
    });
    if (descending) {
      trades = trades.reverse()
    }
    callback(null, trades);
  };
  var endDate = moment().unix();
  // FIXME: there is a bug in meXBT tradesByDate function, that it doesnt return all data
  // when trying to fetch all.
  // So if no since, we just fetch all via trades and giving a high count
  if (since) {
    this.mexbt.tradesByDate({startDate: since.unix(), endDate: endDate}, _.bind(process, this));
  } else {
    this.mexbt.trades({startIndex: 0, count: 100000}, _.bind(process, this));
  }
}


module.exports = Trader;
