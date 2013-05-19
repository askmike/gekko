var moment = require('moment');
var _ = require('underscore');
var config;

// helper functions
var util = {
  set: function(c) {
    config = c
  },
  now: function() {
    return moment().format('YYYY-MM-DD HH:mm:ss');
  },
  minToMs: function(min) {
    return min * 60 * 1000;
  },
  toMicro: function(moment) {
    return moment.format('X') * 1000 * 1000;
  },
  intervalsAgo: function(amount) {
    return moment().subtract('minutes', config.interval * amount);
  },
  average: function(list) {
    var total = _.reduce(list, function(m, n) { return m + n }, 0);
    return total / list.length;
  },
  // calculate the average trade price out of a sample of trades.
  // The sample consists of all trades that happened after the treshold.
  calculatePriceSinceTreshold: function(trades, treshold) {
    var sample = [];
    _.every(trades, function(trade) {
      if(moment.unix(trade.date) < treshold)
        return false;

      var price = parseFloat(trade.price);
      sample.push(price);
      return true;
    });

    return util.average(sample);
  },
  // calculate the average trade price out of a sample of trades.
  // The sample consists of all trades that happened before the treshold.
  calculatePriceTillTreshold: function(trades, treshold) {
    var sample = [];
    _.every(trades, function(trade) {
      if(moment.unix(trade.date) > treshold)
        return false;

      var price = parseFloat(trade.price);
      sample.push(price);
      return true;
    });

    return util.average(sample);
  }
}

module.exports = util;