var _ = require('lodash');
var util = require('../../core/util.js');
var config = util.getConfig();
var dirs = util.dirs();

var log = require(dirs.core + 'log');
var Broker = require(dirs.gekko + '/exchange/gekkoBroker');

var Trader = function(next) {

  this.brokerConfig = {
    ...config.trader,
    ...config.watch,
    private: true
  }

  this.broker = new Broker(this.brokerConfig);
  this.broker.syncPrivateData(() => {
    this.setPortfolio(this.broker.ticker.bid);
    log.info('\t', 'Portfolio:');
    log.info('\t\t', this.portfolio.currency, this.brokerConfig.currency);
    log.info('\t\t', this.portfolio.asset, this.brokerConfig.asset);
    log.info('\t', 'Balance:');
    log.info('\t\t', this.balance, this.brokerConfig.currency);
    next();
  });

  this.sendInitialPortfolio = false;
}

// teach our trader events
util.makeEventEmitter(Trader);

Trader.prototype.setPortfolio = function(price) {
  this.portfolio = {
    currency: _.find(
      this.broker.portfolio.balances,
      b => b.name === this.brokerConfig.asset
    ).amount,
    asset: _.find(
      this.broker.portfolio.balances,
      b => b.name === this.brokerConfig.currency
    ).amount
  }
  this.balance = this.portfolio.currency + this.portfolio.asset * price;
}

Trader.prototype.processCandle = (candle, done) => {
  if(!this.sendInitialPortfolio) {
    this.sendInitialPortfolio = true;
    this.setBalance(candle.close);
    this.deferredEmit('portfolioChange', {
      asset: this.portfolio.asset,
      currency: this.portfolio.currency
    });
    this.deferredEmit('portfolioValueChange', {
      balance: this.balance
    });
  }
}

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
