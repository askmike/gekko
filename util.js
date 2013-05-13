// at this point we assume that config has been set.
var moment = require('moment');
var config;
var util = {
  set: function(c) {
    config = c
  },
  toMicro: function(moment) {
    return moment.format('X') * 1000 * 1000;
  },
  intervalAgo: function() {
    return moment().subtract('m', config.interval);
  }
}

module.exports = util;