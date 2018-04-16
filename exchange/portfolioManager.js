/*
  The portfolio manager is responsible for making sure that
  all decisions are turned into Trades.
*/

var _ = require('lodash');
var util = require('../../core/util');
var dirs = util.dirs();
var events = require('events');
var log = require(dirs.core + 'log');
var async = require('async');
var checker = require(dirs.core + 'exchangeChecker.js');
var moment = require('moment');
var Portfolio = require('./portfolio');
var Trade = require('./trade');

var Manager = function(conf) {
  this.conf = conf;

  var error = checker.cantTrade(conf);
  if(error)
    util.die(error);

  // create an exchange
  let exchangeMeta = checker.settings(conf);
  var Exchange = require(dirs.exchanges + exchangeMeta.slug);
  this.exchange = new Exchange(conf);

  // create a portfolio
  this.portfolio = new Portfolio(conf,this.exchange);

  // contains instantiated trade classes
  this.currentTrade = false
  this.tradeHistory = [];

};

// teach our trader events
util.makeEventEmitter(Manager);

Manager.prototype.init = function(callback) {
  log.debug('portfolioManager : getting balance & fee from', this.exchange.name);

  let prepare = () => {  
    log.info('trading at', this.exchange.name, 'ACTIVE');
    log.info(this.exchange.name, 'trading fee will be:', this.portfolio.fee * 100 + '%'); // Move fee into Exchange class?
    this.portfolio.logPortfolio();
    callback();
  }

  async.series([
    this.portfolio.setFee.bind(this.portfolio),
    this.portfolio.setTicker.bind(this.portfolio),
    this.portfolio.setPortfolio.bind(this.portfolio)
  ], prepare);
}

Manager.prototype.trade = function(what) {

  let makeNewTrade = () => {
    this.newTrade(what)
  }

  // if an active trade is currently happening
  if(this.currentTrade && this.currentTrade.isActive){
    if(this.currentTrade.action !== what){
      // if the action is different, stop the current trade, then start a new one
      this.currentTrade.deactivate(makeNewTrade)
    } else{
      // do nothing, the trade is already going
    }
  } else {
    makeNewTrade()
  }
};

// instantiate a new trade object
Manager.prototype.newTrade = function(what) {
  log.debug("portfolioManager : newTrade() : creating a new Trade class to ", what, this.conf.asset, "/", this.conf.currency)

  // push the current (asummed to be inactive) trade to the history
  if(this.currentTrade){
    this.tradeHistory.push(this.currentTrade)
  }

  return this.currentTrade = new Trade({
    action: what,
    exchange:this.exchange,
    currency: this.conf.currency,
    asset: this.conf.asset,
    portfolio: this.portfolio,
    orderUpdateDelay: this.conf.orderUpdateDelay,
    keepAsset: (this.conf.keepAsset) ? this.conf.keepAsset : false
  })
};

module.exports = Manager;
