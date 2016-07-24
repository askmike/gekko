const _ = require('lodash');
const promisify = require('promisify-node');

const scan = promisify(require('../../core/workers/dateRangeScan/parent'));

// starts a scan
// requires a post body with configuration of:
// 
// - config.watch
const route = function *() {

  var config = require('./baseBacktestConfig');

  var body = JSON.parse(this.request.body.data);

  _.merge(config, body);

  config.debug = false;

  this.body = yield scan(config);
};

module.exports = route;