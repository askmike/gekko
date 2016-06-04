var BTCE = require('btc-e');

var moment = require('moment');
var util = require('../core/util');
var _ = require('lodash');
var log = require('../core/log')

var Trader = function(config) {
  this.key = config.key;
  this.secret = config.secret;
  this.pair = [config.asset, config.currency].join('_').toLowerCase();
  this.name = 'BTC-E';

  _.bindAll(this);

  this.btce = new BTCE(this.key, this.secret);
  _.bindAll(this.btce, ['trade', 'trades', 'getInfo', 'ticker', 'orderList']);

  // see @link https://github.com/askmike/gekko/issues/302
  this.btceHistorocial = new BTCE(false, false, {public_url: 'https://btc-e.com/api/3/'});
  _.bindAll(this.btceHistorocial, 'trades');
}

Trader.prototype.round = function(amount) {
  // Prevent "You incorrectly entered one of fields."
  // because of more than 8 decimals.
  amount *= 100000000;
  amount = Math.floor(amount);
  amount /= 100000000;

  return amount;
}

Trader.prototype.buy = function(amount, price, callback) {
  amount = this.round(amount);

  var set = function(err, data) {
    if(err)
      return log.error('unable to buy:', err);

    callback(null, data.order_id);
  }.bind(this);

  // workaround for nonce error
  setTimeout(function() {
    this.btce.trade(this.pair, 'buy', price, amount, _.bind(set, this));
  }.bind(this), 1000);
}

Trader.prototype.sell = function(amount, price, callback) {
  amount = this.round(amount);

  var set = function(err, data) {
    if(err)
      return log.error('unable to sell:\n\n', err);

    callback(null, data.order_id);
  };

  // workaround for nonce error
  setTimeout(function() {
    this.btce.trade(this.pair, 'sell', price, amount, _.bind(set, this));
  }.bind(this), 1000);
}

// if the exchange errors we try the same call again after
// waiting 10 seconds
Trader.prototype.retry = function(method, args) {
  var wait = +moment.duration(10, 'seconds');
  log.debug(this.name, 'returned an error, retrying..');

  var self = this;

  // run the failed method again with the same
  // arguments after wait
  setTimeout(
    function() { method.apply(self, args) },
    wait
  );
}

Trader.prototype.getPortfolio = function(callback) {
  var calculate = function(err, data) {

    if(err) {
      if(err.message === 'invalid api key')
        util.die('Your ' + this.name + ' API keys are invalid');

      return this.retry(this.btce.getInfo, calculate);
    }

    var portfolio = [];
    _.each(data.funds, function(amount, asset) {
      portfolio.push({name: asset.toUpperCase(), amount: amount});
    });
    callback(err, portfolio);
  }.bind(this);

  this.btce.getInfo(calculate);
}

Trader.prototype.getTicker = function(callback) {
  // BTCE-e doesn't state asks and bids in its
  // ticker
  var set = function(err, data) {

    if(err)
      return this.retry(this.btce.ticker, [this.pair, set]);

    var ticker = _.extend(data.ticker, {
      ask: data.ticker.buy,
      bid: data.ticker.sell
    });
    callback(err, ticker);
  }.bind(this);

  this.btce.ticker(this.pair, set);
}

Trader.prototype.getFee = function(callback) {
  // BTCE-e doesn't have different fees based on orders
  // at this moment it is always 0.2%
  callback(false, 0.002);
}

Trader.prototype.checkOrder = function(order, callback) {
  var check = function(err, result) {
    // btce returns an error when you have no open trades
    // right now we assume on every error that the order
    // was filled.
    //
    // TODO: check whether the error states that there are no
    // open trades or that there is something else.
    if(err)
      callback(false, true);
    else
      callback(err, !result[order]);
  };

  this.btce.orderList({}, _.bind(check, this));
}

Trader.prototype.cancelOrder = function(order) {
  // TODO: properly test
  var devNull = function() {}
  this.btce.orderList(order, devNull);
}

Trader.prototype.getTrades = function(since, callback, descending) {
  var args = _.toArray(arguments);
  var process = function(err, trades) {
    if(err)
      return this.retry(this.getTrades, args);

    if(descending)
      callback(false, trades);
    else
      callback(false, trades.reverse());
  }.bind(this);

  // see @link https://github.com/askmike/gekko/issues/302
  if(since) {
    this.btceHistorocial.makePublicApiRequest(
      'trades',
      this.pair + since,
      this.processAPIv3Trades(process)
    )
  } else
    this.btce.trades(this.pair, process);
}

Trader.prototype.processAPIv3Trades = function(cb) {
  return function(err, data) {
    var trades = _.map(data[this.pair], function(t) {
      return {
        price: t.price,
        amount: t.amount,
        tid: t.tid,
        date: t.timestamp
      }
    })
    cb(err, trades);
  }.bind(this)
}

module.exports = Trader;
