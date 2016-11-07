var settings = {
  wait: 1,
  advice: 'long'
};

// -------

var _ = require('lodash');

var method = {
  init: _.noop,
  update: _.noop,
  log: _.noop,
  check: function() {
    console.log('age:', this.age);
    if(this.age === settings.wait)
      this.advice(settings.advice);  
  }
};

module.exports = method;