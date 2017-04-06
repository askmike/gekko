// simple POST request that returns the candles requested

// expects a config like:

// let config = {
//   watch: {
//     exchange: 'poloniex',
//     currency: 'USDT',
//     asset: 'BTC'
//   },
//   daterange: {
//     from: '2016-05-22 11:22',
//     to: '2016-06-03 19:56'
//   },
//   adapter: 'sqlite',
//   sqlite: {
//     path: 'plugins/sqlite',

//     dataDirectory: 'history',
//     version: 0.1,

//     dependencies: [{
//       module: 'sqlite3',
//       version: '3.1.4'
//     }]
//   },
//   candleSize: 100
// }

const _ = require('lodash');
const promisify = require('tiny-promisify');
const candleLoader = promisify(require('../../core/workers/loadCandles/parent'));
const base = require('./baseConfig');

module.exports = function *() {

  config = {};
  _.merge(config, base, this.request.body);
  this.body = yield candleLoader(config);
}