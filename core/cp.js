// functions that emit information
// to the parent process.
//
// noops if this gekko instance is not a child process!

var _ = require('lodash');
var util = require('./util');
var config = util.getConfig();
var dirs = util.dirs();
var moment = require('moment');

var ENV = util.gekkoEnv();

var cp = {
  message: (type, payload) => {
    payload.type = type;
    process.send(payload);
  },
  update: latest => cp.message('update', { latest }),
  startAt: startAt => cp.message('startAt', { startAt }),
}

if(ENV !== 'child-process') {
  _.each(cp, (val, key) => {
    cp[key] = _.noop;
  });
}

module.exports = cp;