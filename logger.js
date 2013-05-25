var util = require('./util.js');
var _ = require('underscore');
var log = require('./log.js');

var Logger = function(config) {
  this.reportInBTC = config.reportInBTC;

  // virtual balance
  this.start = {
    btc: config.simulationBalance.btc,
    usd: config.simulationBalance.foreign,
    balance: false
  }
  this.current = {
    btc: this.start.btc,
    usd: this.start.usd,
    balance: false
  }
  this.trades = 0;

  _.bindAll(this);

}

// log advice
Logger.prototype.inform = function(what, price, meta) {
  log.info('ADVICE is to', what, meta);
}


// after every succesfull trend ride we end up with more BTC than we started with, 
// this function calculates Gekko's profit in %.
Logger.prototype.trackProfits = function(what, price, meta) {
  // first time calculate the virtual account balance
  if(!this.start.balance) {
    if(this.reportInBTC)
      this.start.balance = this.start.btc + this.start.usd / price;
    else
      this.start.balance = this.start.usd + price * this.start.btc;
  }

  // virtually trade all USD to BTC at the current MtGox price
  if(what === 'BUY') {
    this.current.btc += this.current.usd / price;
    this.current.usd = 0;
    this.trades++;
  }

  // virtually trade all BTC to USD at the current MtGox price
  if(what === 'SELL') {
    this.current.usd += this.current.btc * price;
    this.current.btc = 0;
    this.trades++;
  }

  if(this.reportInBTC)
    this.current.balance = this.current.btc + this.current.usd / price;
  else
    this.current.balance = this.current.usd + price * this.current.btc;

  
  var profit = this.current.balance / this.start.balance * 100 - 100;

  log.info(
    '(PROFIT REPORT)',
    profit.toFixed(3) + '% profit',
    '(in ' + this.trades + ' trades)'
  );
}

module.exports = Logger;