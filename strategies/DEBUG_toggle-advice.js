var settings = {
  wait: 0,
  each: 6
};

// -------

var _ = require('lodash');
var log = require('../core/log.js');

var i = 0;

var method = {
  init: _.noop,
  update: _.noop,
  log: _.noop,
  check: function() {

    if(settings.wait > i)
      return;

    log.info('iteration:', i);
    
    if(i % settings.each === 0)
      this.advice('short');
    else if(i % settings.each === settings.each / 2)
      this.advice('long');

    // if(i % 2 === 0)
    //   this.advice('long');
    // else if(i % 2 === 1)
    //   this.advice('short');

    i++;

  }
};

module.exports = method;