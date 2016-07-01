var OKCoin = require('okcoin-china');
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
    this.pair = [config.asset, config.currency].join('_').toLowerCase();
    this.name = 'okcoin';
    this.okcoin = new OKCoin(this.key, this.secret);
    this.balance;
    this.price;

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
        if (_.isFunction(arg))
            args[i] = _.bind(arg, self);
    });

    // run the failed method again with the same
    // arguments after wait
    setTimeout(
        function() {
            method.apply(self, args)
        },
        wait
    );
}

Trader.prototype.getPortfolio = function(callback) {
  var calculate = function(err, data) {
    if(err) {
      if(err.message === 'invalid api key')
        util.die('Your ' + this.name + ' API keys are invalid');
      return this.retry(this.okcoin.getUserInfo, calculate);
    }
    var portfolio = [];
    _.each(data.info.funds.free, function(amount, asset) {
      portfolio.push({name: asset.toUpperCase(), amount: +amount});
    });
    callback(err, portfolio);
  }.bind(this);
  this.okcoin.getUserInfo(calculate);
}

Trader.prototype.getTicker = function(callback) {
    var args = [this.pair, process];
    var process = function(err, data) {
        if (err)
            return this.retry(this.okcoin.ticker(args));

        var ticker = _.extend(data.ticker, {
            bid: +data.ticker.sell,
            ask: +data.ticker.buy
        });
        callback(err, ticker);
    }.bind(this);
    this.okcoin.getTicker(process, args);
}

// This assumes that only limit orders are being placed, so fees are the
// "maker fee" of 0.1%.  It does not take into account volume discounts.
Trader.prototype.getFee = function(callback) {
    var makerFee = 0.1;
    callback(false, makerFee / 100);
}

Trader.prototype.submit_order = function(type, amount, price, callback) {
    var size = amount = Math.floor(amount * 100000000) / 100000000;
    var order = function(err, data, body) {
            if (err)
                return log.error('unable to ' + type, err, body);

            var order = JSON.parse(body);
            callback(err, order.order_id);
        };
  this.okcoin.addTrade(order, this.pair, type, size, price);

}

Trader.prototype.buy = function(amount, price, callback) {
    this.submit_order('buy', amount, price, callback);
}

Trader.prototype.sell = function(amount, price, callback) {
    this.submit_order('sell', amount, price, callback);
}

Trader.prototype.checkOrder = function(order_id, callback) {
    this.okcoin.order_status(order_id, function(err, data, body) {
        var result = JSON.parse(body);
        callback(err, result.is_live);
    });
}

Trader.prototype.cancelOrder = function(order_id, callback) {
    this.okcoin.cancel_order(order_id, function(err, data, body) {
        var result = JSON.parse(body);
        if (err || !result || !result.is_cancelled)
            log.error('unable to cancel order', order, '(', err, result, ')');
    });
}

Trader.prototype.getTrades = function(since, callback, descending) {
    var args = _.toArray(arguments);
    this.okcoin.getTrades(function(err, data) {
        if (err)
            return this.retry(this.getTrades, args);

        var trades = _.map(data, function(trade) {
            return {
                price: +trade.price,
                amount: +trade.amount,
                tid: +trade.tid,
                date: trade.date
            }
        });
        callback(null, trades);
    }.bind(this), this.pair, since);
}

module.exports = Trader;
