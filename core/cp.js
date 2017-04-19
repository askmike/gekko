// functions that emit data to the parent process.
//
// noops if this gekko instance is not a child process!

var _ = require('lodash');
var util = require('./util');
var config = util.getConfig();
var dirs = util.dirs();
var moment = require('moment');

var ENV = util.gekkoEnv();

var message = (type, payload) => {
  payload.type = type;
  process.send(payload);
}

var cp = {
  // string like: '2016-12-03T22:23:00.000Z'
  update: latest => message('update', { latest }),
  startAt: startAt => message('startAt', { startAt }),

  // object like:
  //
  // {
  //   start: '2016-12-03T22:23:00.000Z',
  //   open: 765,
  //   high: 765,
  //   low: 765,
  //   close: 765,
  //   vwp: 765,
  //   volume: 0,
  //   trades: 0
  // }
  lastCandle: lastCandle => message('lastCandle', { lastCandle }),
  firstCandle: firstCandle => message('firstCandle', { firstCandle }),

  // object like:
  //
  // {
  //   action: 'buy',
  //   price: 942.80838846,
  //   portfolio: { asset: 1.07839516, currency: 0, balance: false },
  //   balance: 1016.7200029226638,
  //   date: <Moment>
  // }
  trade: trade => message('trade', { trade }),
  // object like:
  // {
  //   currency: 'USDT',
  //   asset: 'BTC',
  //   startTime: '2017-03-25 19:41:00',
  //   endTime: '2017-03-25 20:01:00',
  //   timespan: '20 minutes',
  //   market: -0.316304880517734,
  //   balance: 1016.7200029226638,
  //   profit: -26.789997197336106,
  //   relativeProfit: -2.5672966425099304,
  //   yearlyProfit: '-704041.12634599',
  //   relativeYearlyProfit: '-67468.55576516',
  //   startPrice: 945.80000002,
  //   endPrice: 942.80838846,
  //   trades: 10,
  //   startBalance: 1043.5100001199999,
  //   sharpe: -2.676305165560598
  // }
  report: report => message('report', { report }),

  // object like:
  // {
  //   entryAt: Moment<'2017-03-25 19:41:00'>,
  //   entryPrice: 10.21315498,
  //   entryBalance: 98.19707799420277,
  //   exitAt: Moment<'2017-03-25 19:41:00'>
  //   exitPrice: 10.22011632,
  //   exitBalance: 97.9692176,
  //   duration: 3600000,
  //   pnl: -0.2278603942027786,
  //   profit: -0.2320439659276161,
  // }
  roundtrip: roundtrip => message('roundtrip', { roundtrip }),
}

if(ENV !== 'child-process') {
  _.each(cp, (val, key) => {
    cp[key] = _.noop;
  });
}

module.exports = cp;