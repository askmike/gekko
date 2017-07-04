const manager = require('../apiKeyManager');

module.exports = {
  get: function *() {
    this.body = manager.get();
  },
  add: function *() {
    const content = this.request.body;

    manager.add(content.exchange, content.values);

    this.body = 'ok';
  }
}

