// implement the neDB reader and writer

var _ = require('lodash');

var util = require('../core/util.js');
var config = util.getConfig();

var watch = config.watch;
var settings = {
  exchange: watch.exchange,
  pair: [watch.currency, watch.asset],
  historyPath: config.history.directory
}

var needsToRead = config.tradingAdvisor.enabled;

var Writer = require('../core/datastores/nedb/candle-writer');
if(needsToRead)
  var Reader = require('../core/datastores/nedb/candle-reader')

var Store = function() {
  _.bindAll(this);
  this.writer = new Writer(settings);
}

Store.prototype.processCandle = function(candles) {
  this.writer.write(candles);
}