const _ = require('lodash');
const fs = require('co-fs');

const gekkoRoot = __dirname + '/../../';

module.exports = function *() {
  const contents = yield fs.readdir(gekkoRoot + 'methods');
  const strats = contents
    .filter(f => _.last(f, 3).join('') === '.js')
    .map(f => f.slice(0, -3));

  this.body = strats;
}