// internally we only use 1m
// candles, this can easily
// convert them to any desired
// size.

// Acts as stream: takes
// 1m candles as input
// and emits bigger candles
// 
// input are transported candles.

var _ = require('lodash');
var Util = require('util');

var Converter = function(candleSize) {
  this.candleSize = candleSize;
  this.candles = [];
}

var Util = require('util');
var EventEmitter = require('events').EventEmitter;
Util.inherits(Converter, EventEmitter);

Converter.prototype.write = function(candle) {
  this.candles.push(candle);

  if(_.size(this.candles) % this.candleSize !== 0)
    return;

  this.emit('candle', this.calculate());
  this.candles = [];
}

Converter.prototype.calculate = function() {
  var first = this.candles.shift();
  var firstCandle = _.clone(first.candle);

  firstCandle.p = firstCandle.p * firstCandle.v;

  var candle = _.reduce(
    this.candles,
    function(candle, m) {
      m = m.candle;
      candle.h = _.max([candle.h, m.h]);
      candle.l = _.min([candle.l, m.l]);
      candle.c = m.c;
      candle.v += m.v;
      candle.p += m.p * m.v;
      return candle;
    },
    firstCandle
  );

  if(candle.v)
    // we have added up all prices (relative to volume)
    // now divide by volume to get the Volume Weighted Price
    candle.p /= candle.v;
  else
    // empty candle
    candle.p = candle.o;

  candle.start = first.start;

  return candle;
}

module.exports = Converter;
