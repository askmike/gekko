const _ = require('lodash');
const util = require('../../core/util.js');
const config = util.getConfig();
const dirs = util.dirs();
const moment = require('moment');

const log = require(dirs.core + 'log');
const Broker = require(dirs.gekko + '/exchange/gekkoBroker');

const Trader = function(next) {

  this.brokerConfig = {
    ...config.trader,
    ...config.watch,
    private: true
  }

  this.propogatedTrades = 0;

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

  // if more than 10% of balance is in asset we are exposed
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
  const direction = advice.recommendation === 'long' ? 'buy' : 'sell';

  const id = 'trade-' + (++this.propogatedTrades);

  if(this.order) {
    if(this.order.side === direction) {
      return log.info('ignoring advice: already in the process to', direction);
    }

    if(this.cancellingOrder) {
      return log.info('ignoring advice: already cancelling previous', this.order.side, 'order');
    }

    log.info('Received advice to', direction, 'however Gekko is already in the process to', this.order.side);
    log.info('Canceling', this.order.side, 'order first');
    return this.cancelOrder(id, advice, () => this.processAdvice(advice));
  }

  let amount;

  if(direction === 'buy') {

    if(this.exposed) {
      log.info('NOT buying, already exposed');
      return this.deferredEmit('tradeAborted', {
        id,
        adviceId: advice.id,
        action: direction,
        portfolio: this.portfolio,
        balance: this.balance,
        reason: "Portfolio already in position."
      });
    }

    amount = this.portfolio.currency / this.price * 0.95;

    if(amount < this.broker.marketConfig.minimalOrder.amount) {
      log.info('NOT buying, not enough', this.brokerConfig.currency);
      return this.deferredEmit('tradeAborted', {
        id,
        adviceId: advice.id,
        action: direction,
        portfolio: this.portfolio,
        balance: this.balance,
        reason: "Not enough to trade."
      });
    }

    log.info(
      'Trader',
      'Received advice to go long.',
      'Buying ', this.brokerConfig.asset
    );

  } else if(direction === 'sell') {

    if(!this.exposed) {
      log.info('NOT selling, already no exposure');
      return this.deferredEmit('tradeAborted', {
        id,
        adviceId: advice.id,
        action: direction,
        portfolio: this.portfolio,
        balance: this.balance,
        reason: "Portfolio already in position."
      });
    }

    amount = this.portfolio.asset * 0.95;

    if(amount < this.broker.marketConfig.minimalOrder.amount) {
      log.info('NOT selling, not enough', this.brokerConfig.currency);
      return this.deferredEmit('tradeAborted', {
        id,
        adviceId: advice.id,
        action: direction,
        portfolio: this.portfolio,
        balance: this.balance,
        reason: "Not enough to trade."
      });
    }

    log.info(
      'Trader',
      'Received advice to go short.',
      'Selling ', this.brokerConfig.asset
    );
  }

  this.createOrder(direction, amount, advice, id);
}

Trader.prototype.createOrder = function(side, amount, advice, id) {
  const type = 'sticky';

  log.debug('Creating order to', side, amount, this.brokerConfig.asset);

  this.deferredEmit('tradeInitiated', {
    id,
    adviceId: advice.id,
    action: side,
    portfolio: this.portfolio,
    balance: this.balance
  });

  this.order = this.broker.createOrder(type, side, amount);

  this.order.on('filled', f => log.info('[ORDER] partial', side, ' fill, total filled:', f));
  this.order.on('statusChange', s => log.debug('[ORDER] statusChange:', s));

  this.order.on('error', e => {
    log.error('[ORDER] Gekko received error from GB:', e.message);
    log.debug(e);
    this.order = null;
    this.cancellingOrder = false;

    this.deferredEmit('tradeErrored', {
      id,
      adviceId: advice.id,
      date: moment(),
      reason: e.message
    });

  });
  this.order.on('completed', () => {
    this.order.createSummary((err, summary) => {
      log.info('[ORDER] summary:', summary);
      this.order = null;
      this.sync(() => {

        let cost;
        if(_.isNumber(summary.feePercent)) {
          cost = summary.feePercent / 100 * summary.amount * summary.price;
        }

        let effectivePrice;
        if(_.isNumber(summary.feePercent)) {
          if(side === 'buy') {
            effectivePrice = summary.price * (1 + summary.feePercent / 100);
          } else {
            effectivePrice = summary.price * (1 - summary.feePercent / 100);
          }
        } else {
          log.debug('WARNING: exchange did not provide fee information, assuming no fees..');
          effectivePrice = summary.price;
        }

        this.deferredEmit('tradeCompleted', {
          id,
          adviceId: advice.id,
          action: summary.side,
          cost,
          amount: summary.amount,
          price: summary.price,
          portfolio: this.portfolio,
          balance: this.balance,
          date: summary.date,
          feePercent: summary.feePercent,
          effectivePrice
        });
      });
    })
  });
}

Trader.prototype.cancelOrder = function(id, advice, next) {

  if(!this.order) {
    return next();
  }

  this.cancellingOrder = true;

  this.order.removeAllListeners();
  this.order.cancel();
  this.order.once('completed', () => {
    this.deferredEmit('tradeCancelled', {
      id,
      adviceId: advice.id,
      date: moment()
    });
    this.sync(next);
  });
}

module.exports = Trader;
