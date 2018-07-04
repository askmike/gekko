var BitexthaiAPI = require('bitexthai');
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
  this.name = 'BX.in.th';

  this.pair = 1; // todo

  this.bitexthai = new BitexthaiAPI(this.key, this.secret, this.clientID);
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

Trader.prototype.getTrades = function(since, callback, descending) {
  var args = _.toArray(arguments);
  var process = function(err, result) {
    if(err)
      return this.retry(this.getTrades, args);

    var parsedTrades = [];
    _.each(result.trades, function(trade) {
      // We get trade time in local time, which is GMT+7
      var date = moment(trade.trade_date).subtract(7, 'hours').unix();

      parsedTrades.push({
        date: date,
        price: parseFloat(trade.rate),
        amount: parseFloat(trade.amount),
        tid: trade.trade_id
      });
    }, this);

    if(descending)
      callback(null, parsedTrades.reverse());
    else
      callback(null, parsedTrades);
  }.bind(this);

  this.bitexthai.trades(this.pair, process);
}

Trader.getCapabilities = function () {
  return {
    name: 'BX.in.th',
    slug: 'bx.in.th',
    currencies: ['THB'],
    assets: ['BTC'],
    markets: [
      {
        pair: ['THB', 'BTC'], minimalOrder: { amount: 0.0001, unit: 'asset' },
      }
    ],
    requires: ['key', 'secret'],
    tradeError: 'NOT IMPLEMENTED YET',
    providesHistory: false
  };
}

module.exports = Trader;