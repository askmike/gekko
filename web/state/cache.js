const _ = require('lodash');

const cache = {};

module.exports = {
  set: (name, val) => {
    cache[name] = val;
    return true;
  },
  get: name => {
    if(_.has(cache, name))
      return cache[name];
  }
}