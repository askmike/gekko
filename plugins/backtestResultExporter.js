// Small plugin that subscribes to some events, stores
// them and sends it to the parent process.

const log = require('../core/log');
const _ = require('lodash');
const util = require('../core/util.js');
const env = util.gekkoEnv();
const config = util.getConfig();
const moment = require('moment');
const fs = require('fs');

const BacktestResultExporter = function() {
  this.performanceReport;
  this.roundtrips = [];
  this.stratUpdates = [];
  this.stratCandles = [];
  this.trades = [];

  this.candleProps = config.backtestResultExporter.data.stratCandleProps;

  if(!config.backtestResultExporter.data.stratUpdates)
    this.processStratUpdate = null;

  if(!config.backtestResultExporter.data.roundtrips)
    this.processRoundtrip = null;

  if(!config.backtestResultExporter.data.stratCandles)
    this.processStratCandles = null;

  if(!config.backtestResultExporter.data.portfolioValues)
    this.processPortfolioValueChange = null;

  if(!config.backtestResultExporter.data.trades)
    this.processTradeCompleted = null;

  _.bindAll(this);
}

BacktestResultExporter.prototype.processPortfolioValueChange = function(portfolio) {
  this.portfolioValue = portfolio.balance;
}

BacktestResultExporter.prototype.processStratCandle = function(candle) {
  let strippedCandle;

  if(!this.candleProps) {
    strippedCandle = {
      ...candle,
      start: candle.start.unix()
    }
  } else {
    strippedCandle = {
      ..._.pick(candle, this.candleProps),
      start: candle.start.unix()
    }
  }

  if(config.backtestResultExporter.data.portfolioValues)
    strippedCandle.portfolioValue = this.portfolioValue;

  this.stratCandles.push(strippedCandle);
};

BacktestResultExporter.prototype.processRoundtrip = function(roundtrip) {
  this.roundtrips.push({
    ...roundtrip,
    entryAt: roundtrip.entryAt.unix(),
    exitAt: roundtrip.exitAt.unix()
  });
};

BacktestResultExporter.prototype.processTradeCompleted = function(trade) {
  this.trades.push({
    ...trade,
    date: trade.date.unix()
  });
};

BacktestResultExporter.prototype.processStratUpdate = function(stratUpdate) {
  this.stratUpdates.push({
    ...stratUpdate,
    date: stratUpdate.date.unix()
  });
}

BacktestResultExporter.prototype.processPerformanceReport = function(performanceReport) {
  this.performanceReport = performanceReport;
}

BacktestResultExporter.prototype.finalize = function(done) {
  const backtest = {
    performanceReport: this.performanceReport
  };

  if(config.backtestResultExporter.data.stratUpdates)
    backtest.stratUpdates = this.stratUpdates;

  if(config.backtestResultExporter.data.roundtrips)
    backtest.roundtrips = this.roundtrips;

  if(config.backtestResultExporter.data.stratCandles)
    backtest.stratCandles = this.stratCandles;

  if(config.backtestResultExporter.data.trades)
    backtest.trades = this.trades;

  if(env === 'child-process') {
    process.send({backtest});
  }

  if(config.backtestResultExporter.writeToDisk) {
    this.writeToDisk(backtest, done);
  } else {
    done();
  }
};

BacktestResultExporter.prototype.writeToDisk = function(backtest, next) {
  const now = moment().format('YYYY-MM-DD_HH-mm-ss');
  const filename = `backtest-${config.tradingAdvisor.method}-${now}.json`;
  fs.writeFile(
    util.dirs().gekko + filename,
    JSON.stringify(backtest),
    err => {
      if(err) {
        log.error('unable to write backtest result', err);
      } else {
        log.info('written backtest to: ', util.dirs().gekko + filename);
      }

      next();
    }
  );
}

module.exports = BacktestResultExporter;
