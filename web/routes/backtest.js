// simple POST request that returns the backtest result

const _ = require('lodash');
const promisify = require('tiny-promisify');
const pipelineRunner = promisify(require('../../core/workers/pipeline/parent'));

// starts a backtest
// requires a post body like:
//
// {
//   gekkoConfig: {watch: {exchange: "poloniex", currency: "USDT", asset: "BTC"},…},…}
//   data: {
//     candleProps: ["close", "start"],
//     indicatorResults: true,
//     report: true,
//     roundtrips: true
//   }
// }
module.exports = function *() {
  var mode = 'backtest';

  var config = require('./baseConfig');

  var req = this.request.body;

  _.merge(config, req.gekkoConfig);

  var result = yield pipelineRunner(mode, config);

  if(!req.data.report)
    delete result.report;

  if(!req.data.roundtrips)
    delete result.roundtrips;

  if(!req.data.trades)
    delete result.trades;

  // todo: indicatorResults

  result.candles = _.map(
    result.candles,
    c => _.pick(c, req.data.candleProps)
  );

  this.body = result;
}