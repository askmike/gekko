// Budfox is the realtime market for Gekko!
//
// Read more here:
// @link https://github.com/askmike/gekko/blob/stable/docs/internals/budfox.md
//
// > [getting up] I don't know. I guess I realized that I'm just Bud Fox.
// > As much as I wanted to be Gordon Gekko, I'll *always* be Bud Fox.
// > [tosses back the handkerchief and walks away]

var _ = require('lodash');
var async = require('async');

var util = require(__dirname + '/../util');
var dirs = util.dirs();

var Heart = require(dirs.budfox + 'heart');
var MarketDataProvider =  require(dirs.budfox + 'marketDataProvider');
var CandleManager = require(dirs.budfox + 'candleManager');

var BudFox = function(config) {
  _.bindAll(this);

  Readable.call(this, {objectMode: true});

  // BudFox internal modules:
  
  this.heart = new Heart;
  this.marketDataProvider = new MarketDataProvider(config);
  this.candleManager = new CandleManager;

  //    BudFox data flow:

  // relay a marketUpdate event
  this.marketDataProvider.on(
    'marketUpdate',
    e => this.emit('marketUpdate', e)
  );

  // relay a marketStart event
  this.marketDataProvider.on(
    'marketStart',
    e => this.emit('marketStart', e)
  );

  // Output the candles
  this.candleManager.on(
    'candles',
    this.pushCandles
  );

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

  this.heart.pump();
}

var Readable = require('stream').Readable;

BudFox.prototype = Object.create(Readable.prototype, {
  constructor: { value: BudFox }
});

BudFox.prototype._read = function noop() {}

BudFox.prototype.pushCandles = function(candles) {
  _.each(candles, this.push);
}

module.exports = BudFox;
