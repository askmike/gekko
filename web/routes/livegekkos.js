const cache = require('../cache');

module.exports = function *() {
  this.body = cache.get('live_gekkos');
}