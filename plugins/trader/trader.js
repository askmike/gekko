var _ = require('lodash');
var util = require('../../core/util.js');
var config = util.getConfig();
var dirs = util.dirs();

var log = require(dirs.core + 'log');
var Manager = require('./portfolioManager');

var Trader = function(next) {
  _.bindAll(this);

  this.manager = new Manager(_.extend(config.trader, config.watch));
  this.manager.init(next);

  this.mananager.on('trade', trade => {
    this.emit(trade);
  })

  this.mananager.on('portfolioUpdate', trade => {
    this.emit(trade);
  })
}

// teach our trader events
util.makeEventEmitter(Trader);

Trader.prototype.processAdvice = function(advice) {
  if(advice.recommendation == 'long') {
    log.info(
      'Trader',
      'Received advice to go long.',
      'Buying ', config.trader.asset
    );
    this.manager.trade('BUY');
  } else if(advice.recommendation == 'short') {
    log.info(
      'Trader',
      'Received advice to go short.',
      'Selling ', config.trader.asset
    );
    this.manager.trade('SELL');
  }
}

module.exports = Trader;
