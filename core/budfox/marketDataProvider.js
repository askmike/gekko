// 
// The market data provider will fetch data from a datasource on tick. It emits:
// 
// - `trades`: batch of newly detected trades
// - `trade`: after Gekko fetched new trades, this
//   will be the most recent one.

const _ = require('lodash');
const util = require(__dirname + '/../util');

const MarketFetcher = require('./marketFetcher');
const dirs = util.dirs();

const Manager = function(config) {

  _.bindAll(this);

  // fetch trades
  this.source = new MarketFetcher(config);

  // relay newly fetched trades
  this.source
    .on('trades batch', this.relayTrades);
}

util.makeEventEmitter(Manager);

// HANDLERS
Manager.prototype.retrieve = function() {
  this.source.fetch();
}


Manager.prototype.relayTrades = function(batch) {
  this.sendMarketStart(batch);
  this.emit('marketUpdate', batch.last.date);

  this.emit('trades', batch);
}

Manager.prototype.sendMarketStart = _.once(function(batch) {
  this.emit('marketStart', batch.first.date);
});

module.exports = Manager;