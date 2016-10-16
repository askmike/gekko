const _ = require('lodash');
const pipelineRunner = require('../../core/workers/pipeline/parent');

var broadcast;

// starts a backtest
// requires a post body with a config object
module.exports = function *() {
  var mode = 'backtest';

  var config = require('./baseBacktestConfig');

  // console.log(config);
  _.merge(config, this.request.body);

  var relay = type => m => console.log({type: type, message: m});

  pipelineRunner(mode, config, relay);

  this.body = {ok: 'ok'};
}