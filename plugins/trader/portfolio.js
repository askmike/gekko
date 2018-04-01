/*
  The Portfolio class holds the most recent data about the portfolio and ticker
*/

var _ = require('lodash')
var util = require('../../core/util')
var dirs = util.dirs()
var events = require('events')
var log = require(dirs.core + 'log')
var async = require('async')

class Portfolio{
  constructor(conf,exchange){
    _.bindAll(this)
    this.conf = conf
    this.exchange = exchange
    this.portfolio = {}
    this.fee = null
    this.ticker = null
  }

  getBalance(fund) {
    return this.getFund(fund).amount;
  }

  // return the [fund] based on the data we have in memory
  getFund(fund) {
    return _.find(this.portfolio, function(f) { return f.name === fund});
  }

  // convert into the portfolio expected by the performanceAnalyzer
  convertPortfolio(asset,currency) { // rename?
    var asset = _.find(this.portfolio, a => a.name === this.conf.asset).amount;
    var currency = _.find(this.portfolio, a => a.name === this.conf.currency).amount;

    return {
      currency,
      asset,
      balance: currency + (asset * this.ticker.bid)
    }
  }

  logPortfolio() {
    log.info(this.exchange.name, 'portfolio:');
    _.each(this.portfolio, function(fund) {
      log.info('\t', fund.name + ':', parseFloat(fund.amount).toFixed(12));
    });
  };

  setPortfolio(callback) {
    let set = (err, fullPortfolio) => {
      if(err)
        util.die(err);

      // only include the currency/asset of this market
      const portfolio = [ this.conf.currency, this.conf.asset ]
        .map(name => {
          let item = _.find(fullPortfolio, {name});

          if(!item) {
            log.debug(`unable to find "${name}" in portfolio provided by exchange, assuming 0.`);
            item = {name, amount: 0};
          }

          return item;
        });

      this.portfolio = portfolio;

      if(_.isEmpty(this.portfolio))
        this.emit('portfolioUpdate', this.convertPortfolio(this.conf.asset,this.conf.currency,this.ticker.bid));

      if(_.isFunction(callback))
        callback();

    }

    this.exchange.getPortfolio(set);
  }
  
  setFee(callback) {
    let set = (err, fee) => {
      this.fee = fee;

      if(err)
        util.die(err);

      if(_.isFunction(callback))
        callback();
    }
    this.exchange.getFee(set);
  }

  setTicker(callback) {
    let set = (err, ticker) => {
      this.ticker = ticker;

      if(err)
        util.die(err);
      
      if(_.isFunction(callback))
        callback();
    }
    this.exchange.getTicker(set);
  }

}

util.makeEventEmitter(Portfolio)

module.exports = Portfolio