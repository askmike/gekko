const _ = require('lodash');
const util = require('../../core/util.js');
const config = util.getConfig();
const dirs = util.dirs();

const log = require(dirs.core + 'log');
const Broker = require(dirs.gekko + '/exchange/gekkoBroker');

const Trader = function(next) {

  this.brokerConfig = {
    ...config.trader,
    ...config.watch,
    private: true
  }

  this.broker = new Broker(this.brokerConfig);

  if(!this.broker.capabilities.gekkoBroker) {
    util.die('This exchange is not yet supported');
  }

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
  this.cancellingOrder = false;

  _.bindAll(this);
}

// teach our trader events
util.makeEventEmitter(Trader);

Trader.prototype.sync = function(next) {
  log.debug('syncing portfolio');
  this.broker.syncPrivateData(() => {
    this.price = this.broker.ticker.bid;
    this.setPortfolio();
    if(next) {
      next();
    }
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
  this.exposed = this.exposure > 0.1; // if more than 10%
  log.debug('setting portfolio to:', this.portfolio, this.balance, this.exposure);
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
  const direction = advice.recommendation === 'long' ? 'buy' : 'sell';

  if(this.order) {
    if(this.order.side === direction) {
      return log.info('ignoring advice: already in the process to', direction);
    }

    if(this.cancellingOrder) {
      return log.info('ignoring advice: already cancelling previous', this.order.side, 'order');
    }

    log.info('Received advice to', direction, 'however Gekko is already in the process to', this.order.side);
    log.info('Canceling', this.order.side, 'order first');
    return this.cancelOrder(() => this.processAdvice(advice));
  }


  let amount;

  if(direction === 'buy') {
    amount = this.portfolio.currency / this.price * 0.95;

    if(this.exposed) {
      log.info('NOT buying, already exposed');
      return this.deferredEmit('tradeAborted', {
        action: direction,
        portfolio: this.portfolio,
        balance: this.balance
      });
    }

    if(amount < this.broker.marketConfig.minimalOrder.amount) {
      log.info('NOT buying, not enough', this.brokerConfig.currency);
      return this.deferredEmit('tradeAborted', {
        action: direction,
        portfolio: this.portfolio,
        balance: this.balance
      });
    }

    log.info(
      'Trader',
      'Received advice to go long.',
      'Buying ', this.brokerConfig.asset
    );

  } else if(direction === 'sell') {

    amount = this.portfolio.asset * 0.95;

    if(!this.exposed) {
      log.info('NOT selling, already no exposure');
      return this.deferredEmit('tradeAborted', {
        action: direction,
        portfolio: this.portfolio,
        balance: this.balance
      });
    }

    if(amount < this.broker.marketConfig.minimalOrder.amount) {
      log.info('NOT selling, not enough', this.brokerConfig.currency);
      return this.deferredEmit('tradeAborted', {
        action: direction,
        portfolio: this.portfolio,
        balance: this.balance
      });
    }

    log.info(
      'Trader',
      'Received advice to go short.',
      'Selling ', this.brokerConfig.asset
    );
  }

  this.createOrder(direction, amount);
}

Trader.prototype.createOrder = function(side, amount) {
  const type = 'sticky';
  this.order = this.broker.createOrder(type, side, amount);

  this.order.on('filled', f => log.debug('[ORDER]', side, 'total filled:', f));
  this.order.on('statusChange', s => log.debug('[ORDER] statusChange:', s));
  this.order.on('completed', () => {
    this.order.createSummary((err, summary) => {
      log.info('[ORDER] summary:', summary);
      this.order = null;
      this.sync();
    })
  });
}

Trader.prototype.cancelOrder = function(next) {

  if(!this.order) {
    return next();
  }

  this.cancellingOrder = true;

  this.order.removeAllListeners();
  this.order.cancel();
  this.order.once('completed', () => {
    this.order.createSummary((err, summary) => {
      log.info({err, summary});
      this.order = null;
      this.cancellingOrder = false;
      this.sync(next);
    });
  });
}

module.exports = Trader;
