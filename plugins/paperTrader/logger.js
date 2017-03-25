// log paper trade results using the logger

const _ = require('lodash');
const moment = require('moment');

const util = require('../../core/util.js');
const dirs = util.dirs();
const mode = util.gekkoMode();
const log = require(dirs.core + 'log');

const Logger = function(watchConfig) {
  this.currency = watchConfig.currency;
  this.asset = watchConfig.asset;
}

Logger.prototype.round = function(amount) {
  return amount.toFixed(8);
}

Logger.prototype.handleStartBalance = function() {
  // noop
}

// used for:
// - realtime logging (per advice)
// - backtest logging (on finalize)
Logger.prototype.logReport = function(trade, report) {
  // ignore the trade

  var start = this.round(report.startBalance);
  var current = this.round(report.balance);

  log.info(`(PROFIT REPORT) original simulated balance:\t ${start} ${this.currency}`);
  log.info(`(PROFIT REPORT) current simulated balance:\t ${current} ${this.currency}`);
  log.info(
    `(PROFIT REPORT) simulated profit:\t\t ${this.round(report.profit)} ${this.currency}`,
    `(${this.round(report.relativeProfit)}%)`
  );

}

if(mode === 'backtest') {
  // we only want to log a summarized one line report, like:
  // 2016-12-19 20:12:00: Paper trader simulated a BUY 0.000 USDT => 1.098 BTC
  Logger.prototype.handleTrade = function(trade) {
    if(trade.action !== 'sell' && trade.action !== 'buy')
      return;

    var at = trade.date.format('YYYY-MM-DD HH:mm:ss');


    if(trade.action === 'sell')

        log.info(
          `${at}: Paper trader simulated a SELL`,
          `\t${this.round(trade.portfolio.currency)}`,
          `${this.currency} <= ${this.round(trade.portfolio.asset)}`,
          `${this.asset}`
        );

    else if(trade.action === 'buy')

      log.info(
        `${at}: Paper trader simulated a BUY`,
        `\t${this.round(trade.portfolio.currency)}`,
        `${this.currency}\t=> ${this.round(trade.portfolio.asset)}`,
        `${this.asset}`
      );
  }

  Logger.prototype.finalize = function(report) {

    log.info('')
    log.info(`(PROFIT REPORT) start time:\t\t\t ${report.startTime}`);
    log.info(`(PROFIT REPORT) end time:\t\t\t ${report.endTime}`);
    log.info(`(PROFIT REPORT) timespan:\t\t\t ${report.timespan}`);
    log.info();
    log.info(`(PROFIT REPORT) start price:\t\t\t ${report.startPrice} ${this.currency}`);
    log.info(`(PROFIT REPORT) end price:\t\t\t ${report.endPrice} ${this.currency}`);
    log.info(`(PROFIT REPORT) Market:\t\t\t\t ${this.round(report.market)}%`);
    log.info();
    log.info(`(PROFIT REPORT) amount of trades:\t\t ${report.trades}`);

    this.logReport(null, report);

    log.info(
      `(PROFIT REPORT) simulated yearly profit:\t ${report.yearlyProfit}`,
      `${this.currency} (${report.relativeYearlyProfit}%)`
    );
  }

  // Logger.prototype.finalize = function(report) {
  //   process.send({
  //     type: 'report',
  //     report: report
  //   });
  // }

} else if(mode === 'realtime') {
  Logger.prototype.handleTrade = Logger.prototype.logReport;
}




module.exports = Logger;