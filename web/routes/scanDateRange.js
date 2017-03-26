const _ = require('lodash');
const promisify = require('promisify-node');

const scan = promisify(require('../../core/workers/dateRangeScan/parent'));

// starts a scan
// requires a post body with configuration of:
// 
// - config.watch
const route = function *() {

  var config = require('./baseConfig');

  _.merge(config, this.request.body);

  this.body = yield scan(config);
};

module.exports = route;