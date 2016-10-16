var util = require('../core/util.js');
var _ = require('lodash');
var log = require('../core/log.js');
var moment = require('moment');

var mode = util.gekkoMode();

var config = util.getConfig();
var calcConfig = config.profitSimulator;
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

  var what = advice.recommendation;

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

  if(mode === 'realtime')
    this.verboseReport();

  else if(mode === 'backtest') {

    if(ENV === 'standalone')
      this.summarizedReport(what);
    else if(ENV === 'child-process')
      this.jsonReport(what, this.price);
  }
}

Logger.prototype.processCandle = function(candle, done) {
  if(!this.dates.start) {
    this.dates.start = candle.start;
    this.startPrice = candle.open;
  }

  this.dates.end = candle.start.clone().add('m', 1);
  this.endPrice = candle.close;

  this.price = candle.close;

  if(!this.start.balance)
    this.calculateStartBalance();

  if(!calcConfig.verbose)
    return done();

  // skip on history
  if(++this.historyReceived < this.historySize)
    return done();

  done();
}

Logger.prototype.jsonReport = function(what, price) {

  var at = this.dates.end.utc().clone().subtract('m', 1);

  if(what === 'short')
    process.send({
      type: 'trade',
      trade: {
        action: 'sell',
        price: price,
        date: at,
        balance: this.current.currency
      }
    });

  else if(what === 'long')
    process.send({
      type: 'trade',
      trade: {
        action: 'buy',
        price: price,
        date: at,
        balance: this.current.asset * this.price
      }
    });

}

Logger.prototype.summarizedReport = function(what) {

  var time = this.dates.end.utc().format('YYYY-MM-DD HH:mm:ss');

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

  if(this.reportInCurrency)
    this.current.balance = this.current.currency + this.price * this.current.asset;
  else
    this.current.balance = this.current.asset + this.current.currency / this.price;

  this.profit = this.current.balance - this.start.balance;
  this.relativeProfit = this.current.balance / this.start.balance * 100 - 100;

  var start = this.round(this.start.balance);
  var current = this.round(this.current.balance);

  log.info(`(PROFIT REPORT) original simulated balance:\t ${start} ${this.reportIn}`);
  log.info(`(PROFIT REPORT) current simulated balance:\t ${current} ${this.reportIn}`);
  log.info(
    `(PROFIT REPORT) simulated profit:\t\t ${this.round(this.profit)} ${this.reportIn}`,
    '(' + this.round(this.relativeProfit) + '%)'
  );

  if(timespan) {
    log.info(
      '(PROFIT REPORT)',
      'simulated yearly profit:\t',
      this.round(this.profit / timespan.asYears()),
      this.reportIn,
      '(' + this.round(this.relativeProfit / timespan.asYears()) + '%)'
    );
  }
}

// finish up stats for backtesting
if(ENV === 'standalone') {
  Logger.prototype.finalize = function() {
    log.info('')

    log.info(
      '(PROFIT REPORT)',
      'start time:\t\t\t',
      this.dates.start.utc().format('YYYY-MM-DD HH:mm:ss')
    );

    log.info(
      '(PROFIT REPORT)',
      'end time:\t\t\t',
      this.dates.end.utc().format('YYYY-MM-DD HH:mm:ss')
    );

    var timespan = moment.duration(
      this.dates.end.diff(this.dates.start)
    );

    log.info(
      '(PROFIT REPORT)',
      'timespan:\t\t\t',
      timespan.humanize()
    );

    log.info();

    log.info(
      '(PROFIT REPORT)',
      'start price:\t\t\t',
      this.startPrice
    );

    log.info(
      '(PROFIT REPORT)',
      'end price:\t\t\t',
      this.endPrice
    );

    log.info(
      '(PROFIT REPORT)',
      'Buy and Hold profit:\t\t',
      (this.round(this.endPrice * 100 / this.startPrice) - 100) + '%'
    );

    log.info();

    log.info(
      '(PROFIT REPORT)',
      'amount of trades:\t\t',
      this.trades
    );

    this.verboseReport(timespan);
  }
} else if(ENV === 'child-process') {
  Logger.prototype.finalize = function() {
    // todo!
    process.send('done!')
  }
}



module.exports = Logger;
