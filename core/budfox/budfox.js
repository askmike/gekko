// @doc: [TODO]

var _ = require('lodash');
var async = require('async');

var util = require(__dirname + '/../util');
var dirs = util.dirs();

var Heart = require(dirs.budfox + 'heart');
var MarketDataProvider =  require(dirs.budfox + 'marketDataProvider');
var CandleManager = require(dirs.budfox + 'candleManager');

var BudFox = function(config) {
  _.bindAll(this);

  // BudFox internal modules:
  
  this.heart = new Heart;
  this.marketDataProvider = new MarketDataProvider(config);
  this.candleManager = new CandleManager;

  //    BudFox data flow:

  // on every `tick` retrieve trade data
  this.heart.on(
    'tick',
    this.marketDataProvider.retrieve
  );

  // on new trade data create candles
  this.marketDataProvider.on(
    'trades',
    this.candleManager.processTrades
  );

  //    Budfox reports:

  // All those candles
  this.candleManager.on(
    'candles',
    this.broadcast('candles')
  );

  // Trades & last trade
  this.marketDataProvider.on(
    'trades',
    this.broadcast('trades')
  );
  this.marketDataProvider.on(
    'trades',
    this.broadcastTrade
  );
}

util.makeEventEmitter(BudFox);

BudFox.prototype.start = function() {
  this.heart.pump();
}

BudFox.prototype.broadcastTrade = function(trades) {
  _.defer(function() {
    this.emit('trade', trades.last);
  }.bind(this));
}

BudFox.prototype.broadcast = function(message) {
  return function(payload) {
    _.defer(function() {
      this.emit(message, payload);
    }.bind(this));
  }.bind(this);
}

module.exports = BudFox;
