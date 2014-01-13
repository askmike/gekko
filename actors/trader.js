var _ = require('lodash');
var log = require('../core/log.js');
var util = require('../core/util.js');
var config = util.getConfig();
var Manager = require('../core/portfolioManager');

var Trader = function(done) {
  _.bindAll(this);

  this.price = 'N/A';
  this.manager = new Manager(config.normal);

  log.debug('Setup trader.');

  done();
}

Trader.prototype.processTrade = function(trade) {
  this.price = trade.price;
}

Trader.prototype.processAdvice = function(advice) {
  if (advice.recommandation == 'long') {
    this.manager.trade('BUY');
    log.info(
      'Trader',
      'Received advice to go long',
      'Buying ', config.normal.asset
    );
  } else if (advice.recommandation == 'short') {
    this.manager.trade('SELL');
    log.info(
      'Trader',
      'Received advice to go short',
      'Selling ', config.normal.asset
    );
  }
}

module.exports = Trader;
