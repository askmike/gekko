var MtGoxClient = require("mtgox-apiv2");
var util = require('../util.js');
var _ = require('underscore');
var log = require('../log.js');

var Trader = function(config) {
  if(_.isObject(config)) {
    this.key = config.key;
    this.secret = config.secret;
    this.currency = config.currency || 'USD';

    this.checkCurrency(this.currency);

    this.pair = 'BTC' + this.currency;
  }
  this.name = 'Mt. Gox';

  _.bindAll(this);

  this.mtgox = new MtGoxClient(this.key, this.secret, this.pair);
}

Trader.prototype.checkCurrency = function(currency) {
  var supported = [
    'USD',
    'EUR',
    'GBP',
    'AUD',
    'CAD',
    'CHF',
    'CNY',
    'DKK',
    'HKD',
    'PLN',
    'RUB',
    'SGD',
    'THB'
  ];

  if(_.indexOf(supported, currency) === -1)
    throw 'The currency ' + currency + ' is not supported by Gekko at this moment.';
}

Trader.prototype.trade = function(what) {
  if(what !== 'BUY' && what !== 'SELL')
    return;

  log.info('NOW going to', what, '@', this.name);
  if(what === 'BUY')
    this.mtgox.add('bid', 1000);
  if(what === 'SELL')
    this.mtgox.add('ask', 1000);
}

Trader.prototype.getTrades = function(since, callback) {
  if(since)
    since = util.toMicro(since);
  this.mtgox.fetchTrades(since, callback)
}

module.exports = Trader;