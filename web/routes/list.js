const cache = require('../state/cache');

module.exports = function(name) {
  return function *() {
    this.body = cache.get(name).list();
  }
}