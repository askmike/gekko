const _ = require('lodash');
const gekkoRunner = require('../gekko-runner');

var wss;
var broadcast;

// starts a backtest
// requires a post body with configuration of:
// 
// - config.watch
// - config.backtest
// - config.tradingAdvisor
// - all required configuration for the trading method
//   passed to tradingAdvisor.
const route = function *() {
  var mode = 'backtest';

  var config = require('./baseBacktestConfig');

  var body = JSON.parse(this.request.body.data);

  _.merge(config, body);

  config.debug = false;

  var relay = m => broadcast({type: 'log', message: m});

  gekkoRunner(mode, config, relay);

  this.body = 'ok';
}

module.exports = _broadcast => {
  broadcast = _broadcast;

  return route;
};