var EventEmitter = require('events').EventEmitter;
module.exports = new EventEmitter();

var moment = require('moment');
var _ = require('underscore');
var util = require('../util.js');

var init = function(config, mtgox) {
  util.set(config);

  // fetch all trades since [interval in minutes]
  var fetchSince = util.toMicro(util.intervalAgo());
  mtgox.fetchTrades(fetchSince, function(err, json) {
    if (err) throw err;

    _.each(json.data, function(trade) {
      console.log(moment(trade.date * 1000).format('hh:mm:ss'), '\tamount:\t', trade.amount);
    });

    console.log('current time:', moment().format('hh:mm:ss'));
  });

  setTimeout(function() {
    module.exports.emit('advice', 'buy');
  }, 1000);
}

module.exports.on('init', init);