// var csv = require('csv');
var lineReader = require('line-reader');
var Util = require('util');
var EventEmitter = require('events').EventEmitter;
var _ = require('underscore');
var log = require('../log');

// `abstract` constructor
var CandleCalculator = function() {};

Util.inherits(CandleCalculator, EventEmitter);

CandleCalculator.prototype.set = function() {
  this.candles = this.settings.candles;

  this.from = this.settings.from || -Infinity;
  this.to = this.settings.to || Infinity;

  this.currentCandle = this.candles;
  // candles are stored _chronologically_ (first is new, last is old)
  this.candles = {
    open: [],
    high: [],
    low: [],
    close: []
  }

  lineReader.open(this.settings.candleFile, this.processFile);
}

CandleCalculator.prototype.processFile = function(reader) {
  this.fetchingHistorical = true;
  this.reader = reader;
  this.reader.nextLine(_.bind(function(line) {
    // first line has the column headers
    this.emit('prepared');
  }, this));
}

var loadCandle = function() {

}

CandleCalculator.prototype.getNewCandle = function() {
  this.candles.open.shift();
  this.candles.high.shift();
  this.candles.low.shift();
  this.candles.close.shift();

  if(this.reader.hasNextLine())
    this.reader.nextLine(this.addCandle);
  else {
    this.finish();
  }
}

CandleCalculator.prototype.finish = function() {
  this.endPrice = _.last(this.candles.close);
  this.emit('finish', {
    start: this.startPrice,
    end: this.endPrice,
    startTime: this.startTime,
    endTime: this.currentTimestamp
  });
}

CandleCalculator.prototype.getHistoricalCandles = function() {
  this.reader.nextLine(this.addCandle);
}

CandleCalculator.prototype.addCandle = function(line) {
  line = line.split(',');
  this.currentTimestamp = parseInt( line[0] );

  if(this.currentCandle > 0 && this.currentTimestamp < this.from)
    // this candle happened before the `from`, skip this candle and try again
    return this.getHistoricalCandles();
  else if(this.currentCandle === 0 && this.currentTimestamp > this.to)
    // this candle happened after the `to`, we are done!
    return this.finish();

  this.candles.open.push( parseFloat(line[1]) );
  this.candles.high.push( parseFloat(line[2]) );
  this.candles.low.push( parseFloat(line[3]) );
  this.candles.close.push( parseFloat(line[4]) );

  this.emit('calculated candle');

  if(this.currentCandle > 0) {
    this.currentCandle--;
    this.getHistoricalCandles();
  } else {
    if(this.fetchingHistorical) {
      this.startPrice = _.first(this.candles.open);
      this.startTime = this.currentTimestamp;
      this.fetchingHistorical = false;
      log.info('calculated initial EMA, simulating remaining candles')
    }
    this.emit('calculated new candle');
  }
}

// we need:
// getHistoricalCandles
//  -> 'calculted candle'
// getNewCandle
//  -> 'calculted candle'
//  -> 'calculated new candle'

module.exports = CandleCalculator;