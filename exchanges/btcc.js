var BTCChina = require('btcchina');
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
  this.name = 'BTCC';

  this.pair = (config.asset + config.currency).toLowerCase();

  this.btcc = new BTCChina(this.key, this.secret, this.clientID);
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

Trader.prototype.getTicker = function(callback) {
  this.btcc.ticker(this.pair, callback);
}

Trader.prototype.getTrades = function(since, callback, descending) {
  var args = _.toArray(arguments);
  var process = function(err, result) {
    if(err)
      return this.retry(this.getTrades, args);

    if(descending)
      callback(null, result.reverse());
    else
      callback(null, result);
  }.bind(this);

  this.btcc.historydata(this.pair, false, since, process);
}


module.exports = Trader;