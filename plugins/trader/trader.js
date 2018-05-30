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
  this.sync(() => {
    log.info('\t', 'Portfolio:');
    log.info('\t\t', this.portfolio.currency, this.brokerConfig.currency);
    log.info('\t\t', this.portfolio.asset, this.brokerConfig.asset);
    log.info('\t', 'Balance:');
    log.info('\t\t', this.balance, this.brokerConfig.currency);
    log.info('\t', 'Exposed:');
    log.info('\t\t',
      this.exposed ? 'yes' : 'no',
      `(${(this.exposure * 100).toFixed(2)}%)`
    );
    next();
  });

  this.sendInitialPortfolio = false;

  _.bindAll(this);
}

// teach our trader events
util.makeEventEmitter(Trader);

Trader.prototype.sync = function(next) {
  this.broker.syncPrivateData(() => {
    this.price = this.broker.ticker.bid;
    this.setPortfolio();
    next();
  });
}

Trader.prototype.setPortfolio = function() {
  this.portfolio = {
    currency: _.find(
      this.broker.portfolio.balances,
      b => b.name === this.brokerConfig.currency
    ).amount,
    asset: _.find(
      this.broker.portfolio.balances,
      b => b.name === this.brokerConfig.asset
    ).amount
  }
  this.balance = this.portfolio.currency + this.portfolio.asset * this.price;
  this.exposure = (this.portfolio.asset * this.price) / this.balance;
  this.exposed = this.exposure > 0.1;
}

Trader.prototype.processCandle = function(candle, done) {
  this.price = candle.close;
  this.setPortfolio();

  // on init
  if(!this.sendInitialPortfolio) {
    this.sendInitialPortfolio = true;
    this.deferredEmit('portfolioChange', {
      asset: this.portfolio.asset,
      currency: this.portfolio.currency
    });
    this.deferredEmit('portfolioValueChange', {
      balance: this.balance
    });
  } else if(this.exposed) {
    this.deferredEmit('portfolioValueChange', {
      balance: this.balance
    });
  }

  done();
}

Trader.prototype.processAdvice = function(advice) {
  if(advice.recommendation == 'long') {
    log.info(
      'Trader',
      'Received advice to go long.',
      'Buying ', this.brokerConfig.asset
    );
  } else if(advice.recommendation == 'short') {
    log.info(
      'Trader',
      'Received advice to go short.',
      'Selling ', this.brokerConfig.asset
    );
  }
}

Trader.prototype.createOrder = function(side) {

}

module.exports = Trader;
