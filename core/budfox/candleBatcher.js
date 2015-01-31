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
var util = require(__dirname + '/../util');

var CandleBatcher = function(candleSize) {
  if(!_.isNumber(candleSize))
    throw 'candleSize is not a number';

  this.candleSize = candleSize;
  this.smallCandles = [];
  this.candles = [];
}

util.makeEventEmitter(CandleBatcher);

CandleBatcher.prototype.write = function(candles) {
  if(!_.isArray(candles.data))
    throw 'candles.data is not an array';

  _.each(candles.data, function(candle) {
    this.smallCandles.push(candle);
    this.check();
  }, this);

  if(!_.size(this.candles))
    return;

  this.emit('candles', {
    amount: _.size(this.candles),
    data: this.candles
  });
  this.candles = [];
}

CandleBatcher.prototype.check = function() {
  if(_.size(this.smallCandles) % this.candleSize !== 0)
    return;

  this.candles.push(this.calculate(this.smallCandles));
  this.smallCandles = [];
}

CandleBatcher.prototype.calculate = function(smallCandles) {
  var first = smallCandles.shift();
  var firstCandle = _.clone(first.candle);

  firstCandle.p = firstCandle.p * firstCandle.v;

  var candle = _.reduce(
    smallCandles,
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

module.exports = CandleBatcher;
