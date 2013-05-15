var moment = require('moment');
var _ = require('underscore');
var config;

// helper functions
var util = {
  set: function(c) {
    config = c
  },
  toMicro: function(moment) {
    return moment.format('X') * 1000 * 1000;
  },
  intervalsAgo: function(amount) {
    return moment().subtract('minutes', config.interval * amount);
  },
  average: function(list) {
    if(!_.isArray(list))
      list = _.toArray(arguments);

    var total = _.reduce(list, function(m, n) { return m + n }, 0);
    return total / list.length;
  }
}

module.exports = util;