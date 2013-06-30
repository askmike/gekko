var util = require('./util.js');
var _ = require('underscore');
var log = require('./log.js');

var Logger = function(config) {
  this.config = util.getConfig();
  this.verbose = config.verbose;
  this.fee = 1 - config.fee / 100;

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
  if(!this.verbose && what !== 'SELL' && !this.config.backtest)
    return;

  if(!this.verbose && what === 'HOLD' && this.config.backtest)
    return;

  log.info('ADVICE is to', what, meta);
}

Logger.prototype.extractFee = function(amount) {
  amount *= 100000000;
  amount *= this.fee;
  amount = Math.floor(amount);
  amount /= 100000000;
  return amount;
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
    this.current.asset += this.extractFee(this.current.currency / price);
    this.current.currency = 0;
    this.trades++;
  }

  // virtually trade all BTC to USD at the current MtGox price
  if(what === 'SELL') {
    this.current.currency += this.extractFee(this.current.asset * price);
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

  if(!this.verbose && what === 'SELL' && !this.config.backtest)
    this.report();
  else if(this.verbose && !this.config.backtest)
    this.report();
}

Logger.prototype.finish = function(data) {
  console.log();
  console.log();
  
  log.info('\t\tWARNING: BACKTESTING FEATURE NEEDS PROPER TESTING')
  log.info('\t\tWARNING: ACT ON THESE NUMBERS AT YOUR OWN RISK!')

  console.log();
  console.log();

  log.info(
    '(PROFIT REPORT)',
    'start price:\t\t\t',
    data.start
  );

  log.info(
    '(PROFIT REPORT)',
    'end price:\t\t\t',
    data.end
  );

  this.report();
}

Logger.prototype.report = function() {
  var round = function(amount) {
    return amount.toFixed(3);
  }

  log.info(
    '(PROFIT REPORT)',
    'original simulated balance:\t',
    round(this.start.balance),
    this.reportIn
  );

  log.info(
    '(PROFIT REPORT)',
    'current simulated balance:\t',
    round(this.current.balance),
    this.reportIn
  );

  log.info(
    '(PROFIT REPORT)',
    'simulated profit:\t\t',
    round(this.profit),
    this.reportIn,
    '(' + round(this.relativeProfit) + '%)'
  );
}



module.exports = Logger;