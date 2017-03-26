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
const cp = require(dirs.core + 'cp');

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
  this.emit('trades', batch);

  this.sendStartAt(batch);
  cp.update(batch.last.date.format());
}

Manager.prototype.sendStartAt = _.once(function(batch) {
  cp.startAt(batch.first.date.format())
});

module.exports = Manager;