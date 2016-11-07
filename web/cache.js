const _ = require('lodash');

const cache = {};

module.exports = {
  set: (name, val) => {
    if(_.has(cache, name))
      return false

    cache[name] = val;
    return true;
  },
  get: name => {
    if(_.has(cache, name))
      return cache[name];
  }
}