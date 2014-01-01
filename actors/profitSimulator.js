var util = require('../core/util.js');
var _ = require('lodash');
var log = require('../core/log.js');
var moment = require('moment');

var config = util.getConfig();
var calcConfig = config.profitSimulator;
var watchConfig = config.watch;

var Logger = function() {

  _.bindAll(this);

  this.verbose = calcConfig.verbose;
  this.fee = 1 - calcConfig.fee / 100;

  this.currency = watchConfig.currency;
  this.asset = watchConfig.asset;

  this.reportInCurrency = calcConfig.reportInCurrency;

  if(this.reportInCurrency)
    this.reportIn = this.currency;
  else
    this.reportIn = this.asset;

  // virtual balance
  this.start = {
    asset: calcConfig.simulationBalance.asset,
    currency: calcConfig.simulationBalance.currency,
    balance: false
  }
  this.current = _.clone(this.start);
  this.trades = 0;
  this.tracks = 0;

  if(config.enabled)
    log.info('Profit reporter active on simulated balance');

}

Logger.prototype.extractFee = function(amount) {
  amount *= 100000000;
  amount *= this.fee;
  amount = Math.floor(amount);
  amount /= 100000000;
  return amount;
}

Logger.prototype.processTrade = function(trade) {
  this.price = trade.price;
}

// after every succesfull trend ride we hopefully end up 
// with more BTC than we started with, this function 
// calculates Gekko's profit in %.
Logger.prototype.processAdvice = function(advice) {
  this.tracks++;

  var price = this.price;
  var what = advice.recommandation;

  // first time calculate the virtual account balance
  if(!this.start.balance) {
    if(this.reportInCurrency)
      this.start.balance = this.start.currency + price * this.start.asset;
    else
      this.start.balance = this.start.asset + this.start.currency / price;
  }

  // virtually trade all USD to BTC at the current price
  if(what === 'long') {
    this.current.asset += this.extractFee(this.current.currency / price);
    this.current.currency = 0;
    this.trades++;
  }

  // virtually trade all BTC to USD at the current price
  if(what === 'short') {
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

  if(!this.verbose && what === 'short' && !config.backtest.enabled)
    this.report();
  else if(this.verbose && !config.backtest.enabled)
    this.report();
}

// finish up stats for backtesting
Logger.prototype.finish = function(data) {
  var round = function(amount) {
    return amount.toFixed(6);
  }

  console.log();
  console.log();
  
  log.info('\tWARNING: BACKTESTING FEATURE NEEDS PROPER TESTING')
  log.info('\tWARNING: ACT ON THESE NUMBERS AT YOUR OWN RISK!')

  console.log();
  console.log();

  var start = moment.unix(data.startTime);
  var end = moment.unix(data.endTime);
  var timespan = end.diff(start, 'days');

  log.info(
    '(PROFIT REPORT)',
    'start time:\t\t\t',
    start.format('YYYY-MM-DD HH:mm:ss')
  );

  log.info(
    '(PROFIT REPORT)',
    'end time:\t\t\t',
    end.format('YYYY-MM-DD HH:mm:ss')
  );

  log.info(
    '(PROFIT REPORT)',
    'timespan:\t\t\t',
    timespan,
    'days'
  );

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

  log.info(
    '(PROFIT REPORT)',
    'Buy and Hold profit:\t\t',
    round((data.end - data.start) / data.start * 100) + '%'
  );

  console.log();

  log.info(
    '(PROFIT REPORT)',
    'amount of trades:\t\t',
    this.trades
  );

  this.report(timespan);
}

Logger.prototype.report = function(timespan) {
  var round = function(amount) {
    return amount.toFixed(6);
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

  if(timespan) {
    var timespanPerYear = 356 / timespan;

    log.info(
      '(PROFIT REPORT)',
      'simulated yearly profit:\t',
      round(this.profit * timespanPerYear),
      this.reportIn,
      '(' + round(this.relativeProfit * timespanPerYear) + '%)'
    );
  }
}



module.exports = Logger;
