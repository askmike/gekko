var _ = require('lodash');

var config = require('../core/util.js').getConfig();
var settings = config['debug-advice'];

var method = {
  init: _.noop,
  update: _.noop,
  log: _.noop,
  check: function() {
    if(this.age === settings.wait)
      this.advice(settings.advice);  
  }
};

module.exports = method;