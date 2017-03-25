var _ = require('lodash');
var moment = require('moment');

var util = require('../../core/util.js');
var dirs = util.dirs();
var log = require(dirs.core + 'log');
var cp = require(dirs.core + 'cp');

var mode = util.gekkoMode();

var config = util.getConfig();
var calcConfig = config.paperTrader;
var watchConfig = config.watch;

var ENV = util.gekkoEnv();


var Logger = function() {
  _.bindAll(this);

  this.dates = {
    start: false,
    end: false
  }

  this.startPrice = 0;
  this.endPrice = 0;

  this.verbose = calcConfig.verbose;
  this.fee = 1 - (calcConfig.fee + calcConfig.slippage) / 100;

  this.currency = watchConfig.currency;
  this.asset = watchConfig.asset;

  // virtual balance
  this.start = {
    asset: calcConfig.simulationBalance.asset,
    currency: calcConfig.simulationBalance.currency,
    balance: false
  }
  this.current = _.clone(this.start);
  this.trades = 0;
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
  this.start.balance = this.start.currency + this.price * this.start.asset;
}

// after every succesfull trend ride we hopefully end up
// with more BTC than we started with, this function
// calculates Gekko's profit in %.
Logger.prototype.updatePosition = function(advice) {
  let what = advice.recommendation;
  let price = advice.candle.close;
  let at = advice.candle.start.clone().utc().format();

  // virtually trade all {currency} to {asset} at the current price
  if(what === 'long') {
    this.current.asset += this.extractFee(this.current.currency / price);
    this.current.currency = 0;
    this.trades++;
  }

  // virtually trade all {currency} to {asset} at the current price
  if(what === 'short') {
    this.current.currency += this.extractFee(this.current.asset * price);
    this.current.asset = 0;
    this.trades++;
  }
}

// how to report depends on what kind of gekko is running
if(mode === 'realtime') {
  Logger.prototype.report = function(advice) {
    this.verboseReport();
    this.messageTrade(advice);
  }
} else if(mode === 'backtest') {
  Logger.prototype.report = function(advice) {
    var what = advice.recommendation;

    if(what === 'soft')
      return;

    if(ENV === 'standalone')
      this.summarizedReport(advice);
    else if(ENV === 'child-process')
      this.messageTrade(advice);
  }
}

Logger.prototype.processAdvice = function(advice) {
  this.updatePosition(advice);
  this.report(advice);
}

Logger.prototype.processCandle = function(candle, done) {
  if(!this.dates.start) {
    this.dates.start = candle.start;
    this.startPrice = candle.open;
  }

  this.dates.end = candle.start.clone();
  this.endPrice = candle.close;

  this.price = candle.close;

  if(!this.start.balance)
    this.calculateStartBalance();

  done();
}

Logger.prototype.messageTrade = function(advice) {
  var what = advice.recommendation;
  var price = advice.candle.close;
  var at = advice.candle.start;

  if(what !== 'short' && what !== 'long')
    return;

  var payload;
  if(what === 'short')
    payload = {
      action: 'sell',
      price: price,
      date: at,
      balance: this.current.currency
    }
  else
    payload = {
      action: 'buy',
      price: price,
      date: at,
      balance: this.current.asset * price
    }

  cp.trade(payload);
}

Logger.prototype.summarizedReport = function(advice) {

  var time = advice.candle.start.format('YYYY-MM-DD HH:mm:ss');
  var what = advice.recommendation;

  if(what === 'short')

      log.info(
        `${time}: Profit simulator got advice to short`,
        `\t${this.current.currency.toFixed(3)}`,
        `${this.currency} <= ${this.current.asset.toFixed(3)}`,
        `${this.asset}`
      );

  else if(what === 'long')

    log.info(
      `${time}: Profit simulator got advice to long`,
      `\t${this.current.currency.toFixed(3)}`,
      `${this.currency} => ${this.current.asset.toFixed(3)}`,
      `${this.asset}`
    );

}

Logger.prototype.verboseReport = function(timespan) {
  if(!this.start.balance)
    return log.warn('Unable to simulate profits without starting balance');

  let report = this.calculateReportStatistics();

  this.profit = report.profit;
  this.relativeProfit = report.relativeProfit;

  var start = this.round(this.start.balance);
  var current = this.round(report.balance);

  log.info(`(PROFIT REPORT) original simulated balance:\t ${start} ${this.currency}`);
  log.info(`(PROFIT REPORT) current simulated balance:\t ${current} ${this.currency}`);
  log.info(
    `(PROFIT REPORT) simulated profit:\t\t ${this.round(this.profit)} ${this.currency}`,
    '(' + this.round(this.relativeProfit) + '%)'
  );

  if(timespan) {
    log.info(
      '(PROFIT REPORT)',
      'simulated yearly profit:\t',
      report.yearlyProfit,
      this.currency,
      '(' + report.relativeYearlyProfit + '%)'
    );
  }
}

Logger.prototype.calculateReportStatistics = function() {
  // the portfolio's balance is measured in {currency}
  let balance = this.current.currency + this.price * this.current.asset;
  let profit = balance - this.start.balance;
  let timespan = moment.duration(
    this.dates.end.diff(this.dates.start)
  );
  let relativeProfit = balance / this.start.balance * 100 - 100

  let report = {
    currency: this.currency,
    asset: this.asset,

    startTime: this.dates.start.utc().format('YYYY-MM-DD HH:mm:ss'),
    endTime: this.dates.end.utc().format('YYYY-MM-DD HH:mm:ss'),
    timespan: timespan,
    buynhold: this.endPrice * 100 / this.startPrice - 100,
    
    balance: balance,
    profit: profit,
    relativeProfit: relativeProfit,

    yearlyProfit: this.round(profit / timespan.asYears()),
    relativeYearlyProfit: this.round(relativeProfit / timespan.asYears()),
  }

  return report;
}

// finish up stats for backtesting
if(ENV === 'standalone') {
  Logger.prototype.finalize = function() {

    let report = this.calculateReportStatistics();

    log.info('')

    log.info(
      '(PROFIT REPORT)',
      'start time:\t\t\t',
      report.startTime
    );

    log.info(
      '(PROFIT REPORT)',
      'end time:\t\t\t',
      report.endTime
    );

    log.info(
      '(PROFIT REPORT)',
      'timespan:\t\t\t',
      report.timespan.humanize()
    );

    log.info();

    log.info(
      '(PROFIT REPORT)',
      'start price:\t\t\t',
      this.startPrice,
      this.currency
    );

    log.info(
      '(PROFIT REPORT)',
      'end price:\t\t\t',
      this.endPrice,
      this.currency
    );

    log.info(
      '(PROFIT REPORT)',
      'Buy and Hold profit:\t\t',
      this.round(report.buynhold) + '%'
    );

    log.info();

    log.info(
      '(PROFIT REPORT)',
      'amount of trades:\t\t',
      this.trades
    );

    this.verboseReport(report.timespan);
  }
} else if(ENV === 'child-process') {
  Logger.prototype.finalize = function() {
    let report = this.calculateReportStatistics();

    report.timespan = report.timespan.humanize();
    report.startPrice = this.startPrice;
    report.endPrice = this.endPrice;
    report.trades = this.trades;
    report.startBalance = this.start.balance;

    process.send({
      type: 'report',
      report: report
    });
  }
}



module.exports = Logger;
