var _ = require('lodash');
var log = require('../core/log.js');
var config = require('../core/util.js').getConfig();
var Manager = require('../core/portfolioManager');

var Trader = function(next) {
  _.bindAll(this);

  this.manager = new Manager(_.extend(config.trader, config.watch));
  this.manager.init(next);
}

Trader.prototype.processAdvice = function(advice) {
  if(advice.recommendation == 'long') {
    this.manager.trade('BUY');
    log.info(
      'Trader',
      'Received advice to go long',
      'Buying ', config.trader.asset
    );
  } else if(advice.recommendation == 'short') {
    this.manager.trade('SELL');
    log.info(
      'Trader',
      'Received advice to go short',
      'Selling ', config.trader.asset
    );
  }
}

module.exports = Trader;
