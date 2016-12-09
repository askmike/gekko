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
  //   action: 'sell',
  //   price: 765,
  //   date: '2016-12-03T22:23:00.000Z',
  //   balance: 4242
  // }
  trade: trade => message('trade', { trade }),
}

if(ENV !== 'child-process') {
  _.each(cp, (val, key) => {
    cp[key] = _.noop;
  });
}

module.exports = cp;