var _ = require('lodash');
var moment = require('moment');

var util = require('../../core/util.js');
var dirs = util.dirs();
var ENV = util.gekkoEnv();

var config = util.getConfig();
var calcConfig = config.paperTrader;
var watchConfig = config.watch;


// Load the proper module that handles the results
var Handler;
if(ENV === 'child-process')
  Handler = require('./cpRelay');
else
  Handler = require('./logger');

var PaperTrader = function() {
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

  this.handler = new Handler(watchConfig);

  // virtual balance
  this.start = {
    asset: calcConfig.simulationBalance.asset,
    currency: calcConfig.simulationBalance.currency,
    balance: false
  }
  this.current = _.clone(this.start);
  this.trades = 0;


  this.roundTrips = [];
  this.roundTrip = {
    entry: false,
    exit: false
  }
}

PaperTrader.prototype.extractFee = function(amount) {
  amount *= 100000000;
  amount *= this.fee;
  amount = Math.floor(amount);
  amount /= 100000000;
  return amount;
}

PaperTrader.prototype.round = function(amount) {
  return amount.toFixed(8);
}

PaperTrader.prototype.calculateStartBalance = function() {
  this.start.balance = this.start.currency + this.price * this.start.asset;
}

// after every succesfull trend ride we hopefully end up
// with more BTC than we started with, this function
// calculates Gekko's profit in %.
PaperTrader.prototype.updatePosition = function(advice) {
  let what = advice.recommendation;
  let price = advice.candle.close;
  let at = advice.candle.start.clone().utc().format();

  // virtually trade all {currency} to {asset} at the current price
  if(what === 'long') {
    this.current.asset += this.extractFee(this.current.currency / price);
    this.current.currency = 0;
    this.trades++;

    if(!calcConfig.reportRoundtrips)
      return;
    // register entry for roundtrip
    this.roundTrip.entry = {
      date: advice.candle.start,
      price: price,
      total: this.current.asset * price,
    }
  }

  // virtually trade all {currency} to {asset} at the current price
  else if(what === 'short') {
    this.current.currency += this.extractFee(this.current.asset * price);
    this.current.asset = 0;
    this.trades++;

    const firstTrade = this.trades === 1;
    if(firstTrade || !calcConfig.reportRoundtrips) 
      return;

    // we just did a roundtrip
    this.roundTrip.exit = {
      date: advice.candle.start,
      price: price,
      total: this.current.currency
    }
    this.handleRoundtrip();
  }
}

PaperTrader.prototype.handleRoundtrip = function() {
  const roundtrip = {
    entryAt: this.roundTrip.entry.date,
    entryPrice: this.roundTrip.entry.price,
    entryBalance: this.roundTrip.entry.total,

    exitAt: this.roundTrip.exit.date,
    exitPrice: this.roundTrip.exit.price,
    exitBalance: this.roundTrip.exit.total,

    duration: this.roundTrip.exit.date.diff(this.roundTrip.entry.date)
  }

  roundtrip.pnl = roundtrip.exitBalance - roundtrip.entryBalance;
  roundtrip.profit = (100 * roundtrip.exitBalance / roundtrip.entryBalance) - 100;

  this.handler.handleRoundtrip(roundtrip);
}

PaperTrader.prototype.processAdvice = function(advice) {

  if(advice.recommendation === 'soft')
    return;

  this.updatePosition(advice);
  let trade = this.calcTrade(advice);
  let report = this.calculateReportStatistics();
  this.handler.handleTrade(trade, report);
}

PaperTrader.prototype.processCandle = function(candle, done) {
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

PaperTrader.prototype.calcTrade = function(advice) {
  var what = advice.recommendation;
  var price = advice.candle.close;
  var at = advice.candle.start;

  if(what !== 'short' && what !== 'long')
    return {action: what};

  let action;
  if(what === 'short') {
    action = 'sell';
  } else {
    action = 'buy';
  }

  return {
    action,
    price,
    portfolio: _.clone(this.current),
    balance: this.current.currency + this.price * this.current.asset,
    date: at
  }
}

PaperTrader.prototype.calculateReportStatistics = function() {
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
    timespan: timespan.humanize(),
    market: this.endPrice * 100 / this.startPrice - 100,


    balance: balance,
    profit: profit,
    relativeProfit: relativeProfit,

    yearlyProfit: this.round(profit / timespan.asYears()),
    relativeYearlyProfit: this.round(relativeProfit / timespan.asYears()),

    startPrice: this.startPrice,
    endPrice: this.endPrice,
    trades: this.trades,
    startBalance: this.start.balance
  }

  report.alpha = report.profit - report.market;

  return report;
}

PaperTrader.prototype.finalize = function() {
  const report = this.calculateReportStatistics();
  this.handler.finalize(report);
}



module.exports = PaperTrader;
