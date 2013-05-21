var MtGoxClient = require("mtgox-apiv2");
var util = require('../util.js');
var _ = require('underscore');

var trader = function(config) {
  if(_.isObject(config)) {
    this.key = config.key;
    this.secret = config.secret;
  }
  this.name = 'Mt. Gox';

  _.bindAll(this);

  this.mtgox = new MtGoxClient(this.key, this.secret);
}

trader.prototype.trade = function(what) {
  if(what !== 'BUY' && what !== 'SELL')
    return;

  console.log(util.now(), 'NOW going to', what, '@', this.name);
  if(what === 'BUY')
    this.mtgox.add('bid', 1000);
  if(what === 'SELL')
    this.mtgox.add('ask', 1000);
}

trader.prototype.getTrades = function(since, callback) {
  if(since)
    since = util.toMicro(since);
  this.mtgox.fetchTrades(since, callback)
}

module.exports = trader;