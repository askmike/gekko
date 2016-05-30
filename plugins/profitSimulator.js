var util = require('../core/util.js');
var _ = require('lodash');
var log = require('../core/log.js');
var moment = require('moment');

var config = util.getConfig();
var calcConfig = config.profitSimulator;
var watchConfig = config.watch;

var Logger = function() {

  _.bindAll(this);

  this.historySize = config.tradingAdvisor.historySize;
  this.historyReceived = 0;

  this.verbose = calcConfig.verbose;
  this.fee = 1 - (calcConfig.fee + calcConfig.slippage) / 100;

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

Logger.prototype.round = function(amount) {
  return amount.toFixed(5);
}

Logger.prototype.calculateStartBalance = function() {
  if(this.reportInCurrency)
    this.start.balance = this.start.currency + this.price * this.start.asset;
  else
    this.start.balance = this.start.asset + this.start.currency / this.price;
}

// after every succesfull trend ride we hopefully end up
// with more BTC than we started with, this function
// calculates Gekko's profit in %.
Logger.prototype.processAdvice = function(advice) {
  this.tracks++;

  var what = advice.recommandation;

  // virtually trade all USD to BTC at the current price
  if(what === 'long') {
    this.current.asset += this.extractFee(this.current.currency / this.price);
    this.current.currency = 0;
    this.trades++;
  }

  // virtually trade all BTC to USD at the current price
  if(what === 'short') {
    this.current.currency += this.extractFee(this.current.asset * this.price);
    this.current.asset = 0;
    this.trades++;
  }

  if(!this.verbose) // && !config.backtest.enabled)
    this.report();
}

Logger.prototype.processCandle = function(candle) {

  this.price = candle.close;

  if(!this.start.balance)
    this.calculateStartBalance()

  if(!calcConfig.verbose)
    return;

  // skip on history
  if(++this.historyReceived < this.historySize)
    return;

  this.report();
}

Logger.prototype.report = function(timespan) {
  if(!this.start.balance)
    return log.warn('Unable to simulate profits without starting balance');

  if(this.reportInCurrency)
    this.current.balance = this.current.currency + this.price * this.current.asset;
  else
    this.current.balance = this.current.asset + this.current.currency / this.price;

  this.profit = this.current.balance - this.start.balance;
  this.relativeProfit = this.current.balance / this.start.balance * 100 - 100;

  log.info(
    '(PROFIT REPORT)',
    'original simulated balance:\t',
    this.round(this.start.balance),
    this.reportIn
  );

  log.info(
    '(PROFIT REPORT)',
    'current simulated balance:\t',
    this.round(this.current.balance),
    this.reportIn
  );

  log.info(
    '(PROFIT REPORT)',
    'simulated profit:\t\t',
    this.round(this.profit),
    this.reportIn,
    '(' + this.round(this.relativeProfit) + '%)'
  );

  if(timespan) {
    var timespanPerYear = 356 / timespan;

    log.info(
      '(PROFIT REPORT)',
      'simulated yearly profit:\t',
      this.round(this.profit * timespanPerYear),
      this.reportIn,
      '(' + this.round(this.relativeProfit * timespanPerYear) + '%)'
    );
  }
}

// finish up stats for backtesting
Logger.prototype.finish = function(data) {
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
    this.round((data.end - data.start) / data.start * 100) + '%'
  );

  console.log();

  log.info(
    '(PROFIT REPORT)',
    'amount of trades:\t\t',
    this.trades
  );

  this.report(timespan);
}



module.exports = Logger;
