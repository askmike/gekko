var Poloniex = require("poloniex.js");
var util = require('../core/util.js');
var _ = require('lodash');
var moment = require('moment');
var log = require('../core/log');

// Helper methods
function joinCurrencies(currencyA, currencyB){
    return currencyA + '_' + currencyB;
}

var Trader = function(config) {
  _.bindAll(this);
  if(_.isObject(config)) {
    this.key = config.key;
    this.secret = config.secret;
    this.clientID = config.username;
    this.currency = config.currency;
    this.asset = config.asset;
  }
  this.name = 'Poloniex';
  this.balance;
  this.price;

  this.poloniex = new Poloniex(this.key, this.secret);
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
    _.each(data, function(amount, asset) {
      if(asset.indexOf('available') !== -1) {
        //asset = asset.substr(0, 3).toUpperCase();
        portfolio.push({name: asset, amount: parseFloat(amount)});
      }
    });
    callback(err, portfolio);
  }
  this.poloniex.myBalances(_.bind(set, this));
}

Trader.prototype.getTicker = function(callback) {
  this.poloniex.getTicker(callback);
}

Trader.prototype.getFee = function(callback) {
  var set = function(err, data) {
    if(err)
      callback(err);

    callback(false, parseFloat(data.takerFee));
  }
  this.poloniex._private('returnFeeInfo', _.bind(set, this));
}

Trader.prototype.buy = function(amount, price, callback) {
  var set = function(err, result) {
    if(err || result.error)
      return log.error('unable to buy:', err, result);

    callback(null, result.orderNumber);
  };

  this.poloniex.buy(this.currency, this.asset, price, amount, _.bind(set, this));
}

Trader.prototype.sell = function(amount, price, callback) {
  var set = function(err, result) {
    if(err || result.error)
      return log.error('unable to sell:', err, result);

    callback(null, result.orderNumber);
  };

  this.poloniex.sell(this.currency, this.asset, price, amount, _.bind(set, this));
}

Trader.prototype.checkOrder = function(order, callback) {
  var check = function(err, result) {
    var stillThere = _.find(result, function(o) { return o.orderNumber === order });
    callback(err, !stillThere);
  };

  this.poloniex.myOpenOrders(_.bind(check, this));
}

Trader.prototype.cancelOrder = function(order, callback) {
  var cancel = function(err, result) {
    if(err || !result.success) {
      log.error('unable to cancel order', order, '(', err, result, ')');
      // return this.retry(this.cancelOrder, args);
    }
  };

  this.poloniex.cancelOrder(this.currency, this.asset, order, _.bind(cancel, this));
}

Trader.prototype.getTrades = function(since, callback, descending) {
  var args = _.toArray(arguments);
  var process = function(err, result) {
    if(err) {
      return this.retry(this.getTrades, args);
    }

    result = _.map(result, function(trade) {
    	return {
        date: moment.utc(trade.date).format('X'),
        price: trade.rate,
        tid: trade.tradeID
      };
    });

    callback(null, result.reverse());
  };

  var params = {
    currencyPair: joinCurrencies(this.currency, this.asset)
  }
  if (since)
    params.start = _.isNumber(since) ? since : since.format('X');

  this.poloniex._public('returnTradeHistory', params, _.bind(process, this));
}


module.exports = Trader;
