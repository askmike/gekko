var _ = require('lodash');
var moment = require('moment');

var utils = require('../core/util');
var dirs = utils.dirs();
var CandleConverter = require(dirs.core + 'candleConverter');

return;



var candles = [
  {
    candle: {"s":1,"o":798,"h":800,"l":796.22,"c":799.7,"v":16.47933287,"p":797.3895533358943},
    start: moment.utc('2013-10-20 00:01:00'),
    day: moment.utc('2013-10-20 00:00:00')
  },
  {
    candle: {"s":2,"o":798,"h":800,"l":796.22,"c":799.7,"v":3,"p":797.3895533358943},
    start: moment.utc('2013-10-20 00:02:00'),
    day: moment.utc('2013-10-20 00:00:00')
  },
  {
    candle: {"s":3,"o":783.129,"h":783.992,"l":783,"c":783,"v":5,"p":783.0360555600381},
    start: moment.utc('2013-10-20 00:03:00'),
    day: moment.utc('2013-10-20 00:00:00')
  },
  {
    candle: {"s":4,"o":810.505,"h":810.505,"l":810.495,"c":810.499,"v":1.0870225,"p":810.4990344675479},
    start: moment.utc('2013-10-20 00:04:00'),
    day: moment.utc('2013-10-20 00:00:00')
  },
  {
    candle: {"s":5,"o":797.401,"h":797.401,"l":797.401,"c":797.401,"v":0.27908,"p":797.4010000000001},
    start: moment.utc('2013-10-20 00:05:00'),
    day: moment.utc('2013-10-20 00:00:00')
  },
  {
    candle: {"s":6,"o":797.401,"h":797.401,"l":797.401,"c":797.401,"v":0,"p":797.401},
    start: moment.utc('2013-10-20 00:06:00'),
    day: moment.utc('2013-10-20 00:00:00')
  }
];


var test = {};

// test the amount of generated candles
test.amount = function(test) {
  test.expect(3);

  var cc3 = new CandleConverter(3);
  cc3.on('candle', function() {
    test.equals(1, 1);
  });

  cc3.write(candles[0]);
  cc3.write(candles[1]);
  cc3.write(candles[2]);
  // should have created one 
  // candle now.

  var cc1 = new CandleConverter(1);
  cc1.on('candle', function() {
    test.equals(1, 1);
  });
  cc1.write(candles[3]);
  cc1.write(candles[4]);
  // should have created two 
  // candles now.

  test.done();
}

// test the result of generated candles
test.result = function(test) {
  var c0 = candles[0];
  var c0c = c0.candle;
  var c1 = candles[1];
  var c1c = c1.candle;
  var c2 = candles[2];
  var c2c = c2.candle;

  var cc3 = new CandleConverter(3);
  cc3.on('candle', function(c) {

    // start should be the same as first candle
    test.ok(utils.equals(c.start, c0.start));

    // close should be end close
    test.equals(c.c, c2c.c);

    // open should be start open
    test.equals(c.o, c0c.o);

    // volume should be total
    test.equals(c.v, c0c.v + c1c.v + c2c.v);

    // low should be lowest
    test.equals(c.l, _.min([c0c.l, c1c.l, c2c.l]));

    // high should be highest
    test.equals(c.h, _.max([c0c.h, c1c.h, c2c.h]));

    // vwp should be vwp
    var totalP = 0;
    var totalV = 0;
    _.each([c0c, c1c, c2c], function(cc) {
      totalP += cc.p * cc.v;
      totalV += cc.v;
    });
    test.equals(c.p, totalP / totalV);

    test.done();
  });

  cc3.write(c0);
  cc3.write(c1);
  cc3.write(c2);
}


module.exports = test;