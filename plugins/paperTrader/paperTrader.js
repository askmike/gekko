const _ = require('lodash');

const util = require('../../core/util');
const ENV = util.gekkoEnv();

const config = util.getConfig();
const calcConfig = config.paperTrader;
const watchConfig = config.watch;

const PaperTrader = function() {
  _.bindAll(this);

  this.fee = 1 - (calcConfig['fee' + calcConfig.feeUsing.charAt(0).toUpperCase() + calcConfig.feeUsing.slice(1)] + calcConfig.slippage) / 100;

  this.currency = watchConfig.currency;
  this.asset = watchConfig.asset;

  this.portfolio = {
    asset: calcConfig.simulationBalance.asset,
    currency: calcConfig.simulationBalance.currency,
    balance: false
  }
}

// teach our paper trader events
util.makeEventEmitter(PaperTrader);

PaperTrader.prototype.relayTrade = function(advice) {
  var what = advice.recommendation;
  var price = advice.candle.close;
  var at = advice.candle.start;

  let action;
  if(what === 'short')
    action = 'sell';
  else if(what === 'long')
    action = 'buy';
  else
    return;

  this.emit('trade', {
    action,
    price,
    portfolio: _.clone(this.portfolio),
    balance: this.portfolio.currency + this.price * this.portfolio.asset,
    date: at
  });
}

PaperTrader.prototype.relayPortfolio = function() {
  this.emit('portfolioUpdate', _.clone(this.portfolio));
}

PaperTrader.prototype.extractFee = function(amount) {
  amount *= 1e8;
  amount *= this.fee;
  amount = Math.floor(amount);
  amount /= 1e8;
  return amount;
}

PaperTrader.prototype.setStartBalance = function() {
  this.portfolio.balance = this.portfolio.currency + this.price * this.portfolio.asset;
  this.relayPortfolio();
}

// after every succesfull trend ride we hopefully end up
// with more BTC than we started with, this function
// calculates Gekko's profit in %.
PaperTrader.prototype.updatePosition = function(advice) {
  let what = advice.recommendation;
  let price = advice.candle.close;

  // virtually trade all {currency} to {asset}
  // at the current price (minus fees)
  if(what === 'long') {
    this.portfolio.asset += this.extractFee(this.portfolio.currency / price);
    this.portfolio.currency = 0;
    this.trades++;
  }

  // virtually trade all {currency} to {asset}
  // at the current price (minus fees)
  else if(what === 'short') {
    this.portfolio.currency += this.extractFee(this.portfolio.asset * price);
    this.portfolio.asset = 0;
    this.trades++;
  }
}

PaperTrader.prototype.processAdvice = function(advice) {
  if(advice.recommendation === 'soft')
    return;

  this.updatePosition(advice);
  this.relayTrade(advice);
}

PaperTrader.prototype.processCandle = function(candle, done) {
  this.price = candle.close;

  if(!this.portfolio.balance)
    this.setStartBalance();

  done();
}

module.exports = PaperTrader;
