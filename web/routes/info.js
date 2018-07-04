const p = require('../../package.json');

// Retrieves API information
module.exports = function *() {
  this.body = {
    version: p.version
  }
}