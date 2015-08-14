var BitX = require("bitx")
var util = require('../core/util.js');
var _ = require('lodash');
var moment = require('moment');
var log = require('../core/log');

var Trader = function(config) {
  _.bindAll(this);
  if(_.isObject(config)) {
    this.key = config.key;
    this.secret = config.secret;
  }
  this.name = 'BitX';
  this.pair = config.asset + config.currency;
  this.bitx = new BitX(this.key, this.secret, { pair: this.pair });

}

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

Trader.prototype.getTrades = function(since, callback, descending) {
  var args = _.toArray(arguments);
  var process = function(err, result) {
    if(err)
      return this.retry(this.getTrades, args);

    trades = _.map(result.trades, function (t) {
      return { price: t.price, date: (t.timestamp / 1000), amount: t.volume };
    });

    // API returns 30 days by default
    // CandleManager can't process more than 2 days
    yesterday = moment(moment().utc().format('YYYY-MM-DD +0000')).subtract(1, 'days').unix()
    trades = _.reject(trades, function(t){
      return t.date < yesterday
    })

    // Decending by default
    if (!descending) {
      trades = trades.reverse()
    }
    callback(null, trades);
  };

  this.bitx.getTrades(_.bind(process, this));
}


Trader.prototype.buy = function(amount, price, callback) {

}

Trader.prototype.sell = function(amount, price, callback) {

}

Trader.prototype.getPortfolio = function(callback) {

}

Trader.prototype.getTicker = function(callback) {

}

Trader.prototype.getFee = function(callback) {
  
}

Trader.prototype.checkOrder = function(order, callback) {

}

Trader.prototype.cancelOrder = function(order) {

}


module.exports = Trader;
