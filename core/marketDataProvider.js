// 
// The market data provider will fetch data from a datasource on tick. It emits:
// 
// - `trades`: batch of newly detected trades
// - `trade`: after Gekko fetched new trades, this
//   will be the most recent one.

var _ = require('lodash');
var util = require('./util');

var MarketFetcher = require('./marketFetcher');

// TODO: this doesnt really belong here
var exchangeChecker = require('./exchangeChecker');

var config = util.getConfig();

var Manager = function() {

  _.bindAll(this);

  // exchange settings
  this.exchange = exchangeChecker.settings(config.watch);

  // fetch trades
  // TODO: make conditional
  this.source = new MarketFetcher;

  // relay newly fetched trades
  this.source
    .on('trades batch', this.relayTrades);
}

var Util = require('util');
var EventEmitter = require('events').EventEmitter;
Util.inherits(Manager, EventEmitter);

// HANDLERS
Manager.prototype.onTick = function() {
  this.source.fetch();
}


Manager.prototype.relayTrades = function(batch) {
  this.emit('trades', batch);
}

module.exports = Manager;