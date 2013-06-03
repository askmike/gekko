var util = require('./util.js');
var _ = require('underscore');
var log = require('./log.js');

var Logger = function(config) {
  this.verbose = config.verbose;
  this.reportInCurrency = config.reportInCurrency;
  if(this.reportInCurrency)
    this.reportIn = config.currency;
  else
    this.reportIn = config.asset;

  // virtual balance
  this.start = {
    asset: config.simulationBalance.asset,
    currency: config.simulationBalance.currency,
    balance: false
  }
  this.current = {
    asset: this.start.asset,
    currency: this.start.currency,
    balance: false
  }
  this.trades = 0;
  this.tracks = 0;

  _.bindAll(this);

  if(config.enabled)
    log.info('Profit reporter active on simulated balance');

}

// log advice
Logger.prototype.inform = function(what, price, meta) {
  log.info('ADVICE is to', what, meta);
}

// after every succesfull trend ride we end up with more BTC than we started with, 
// this function calculates Gekko's profit in %.
Logger.prototype.trackProfits = function(what, price, meta) {
  this.tracks++;

  // first time calculate the virtual account balance
  if(!this.start.balance) {
    if(this.reportInCurrency)
      this.start.balance = this.start.currency + price * this.start.asset;
    else
      this.start.balance = this.start.asset + this.start.currency / price;
  }

  // virtually trade all USD to BTC at the current MtGox price
  if(what === 'BUY') {
    this.current.asset += this.current.currency / price;
    this.current.currency = 0;
    this.trades++;
  }

  // virtually trade all BTC to USD at the current MtGox price
  if(what === 'SELL') {
    this.current.currency += this.current.asset * price;
    this.current.asset = 0;
    this.trades++;
  }

  if(this.reportInCurrency)
    this.current.balance = this.current.currency + price * this.current.asset;
  else
    this.current.balance = this.current.asset + this.current.currency / price;

  this.profit = this.current.balance - this.start.balance;
  this.relativeProfit = this.current.balance / this.start.balance * 100 - 100;

  if(this.tracks === 1)
    return;

  if(!this.verbose && what === 'SELL')
    this.report();
  else if(this.verbose)
    this.report();
}

Logger.prototype.report = function() {
  var round = function(amount) {
    return amount.toFixed(3);
  }

  log.info(
    '(PROFIT REPORT)',
    'original balance:\t',
    round(this.start.balance),
    this.reportIn
  );

  log.info(
    '(PROFIT REPORT)',
    'current balance:\t',
    round(this.current.balance),
    this.reportIn
  );

  log.info(
    '(PROFIT REPORT)',
    'profit:\t\t\t',
    round(this.profit),
    this.reportIn,
    '(' + round(this.relativeProfit) + '%)'
  );
}



module.exports = Logger;