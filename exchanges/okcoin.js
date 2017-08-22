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
    this.lastTid = false;
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
            return this.retry(this.okcoin.getTicker(args));

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

Trader.prototype.buy = function(raw_amount, price, callback) {
  var amount = Math.floor(raw_amount * 10000) / 10000
  var set = function(err, result) {
    if(err)
      return log.error('unable to process order:', err, result);

    callback(null, result.order_id);
  }.bind(this);

  this.okcoin.addTrade(set, this.pair, 'buy', amount, price);
}

Trader.prototype.sell = function(raw_amount, price, callback) {
  var amount = Math.floor(raw_amount * 10000) / 10000
  var set = function(err, result) {
    if(err)
      return log.error('unable to process order:', err, result);

    callback(null, result.order_id);
  }.bind(this);

  this.okcoin.addTrade(set, this.pair, 'sell', amount, price);
}


Trader.prototype.checkOrder = function(order_id, callback) {
  var check = function(err, result) {
    if(err || !result.result) {
      log.error('Perhaps the order already got filled?', '(', result, ')');
      callback(err, !result.result);
    } else {
      callback(err, true);
    }
  }

  this.okcoin.getOrderInfo(check, this.pair, order_id);
}

Trader.prototype.cancelOrder = function(order_id, callback) {
  var cancel = function(err, result) {
    if(err || !result.result) {
      return log.error('unable to cancel order ', order_id, '(', result, ')');
    }

    callback();
  }.bind(this);

  this.okcoin.cancelOrder(cancel, this.pair, order_id);
}

Trader.prototype.getOrder = function(order_id, callback) {

  var handle = (err, resp) => {
    var order = _.first(resp.orders);

    var amount = order.deal_amount;
    var price = order.price;
    var date = moment(order.date).utc();

    callback(undefined, {amount, price, date});
  }

  this.okcoin.getOrderInfo(handle, this.pair, order_id)
}

Trader.prototype.getTrades = function(since, callback, descending) {
    var args = _.toArray(arguments);

    if(since)
      since = 600;

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

        callback(null, trades.reverse());
    }.bind(this), this.pair, since);
}

Trader.getCapabilities = function () {
  return {
    name: 'OkCoin',
    slug: 'okcoin',
    currencies: ['BTC', 'CNY'],
    assets: ['BTC', 'LTC'],
    markets: [
      { pair: ['CNY', 'BTC'], minimalOrder: { amount: 0.01, unit: 'asset' } },
      { pair: ['CNY', 'LTC'], minimalOrder: { amount: 0.01, unit: 'asset' } }
    ],
    requires: ['key', 'secret', 'username'],
    providesHistory: false,
    fetchTimespan: 60,
    tid: 'date',
    tradable: true
  };
}

module.exports = Trader;