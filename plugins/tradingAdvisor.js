var util = require('../core/util');
var _ = require('lodash');
var fs = require('fs');

var config = util.getConfig();
var dirs = util.dirs();
var log = require(dirs.core + 'log');
var CandleBatcher = require(dirs.core + 'candleBatcher');

var moment = require('moment');

var Actor = function(done) {
  _.bindAll(this);

  this.done = done;

  this.batcher = new CandleBatcher(config.tradingAdvisor.candleSize);

  var mode = util.gekkoMode();

  if(mode === 'realtime') {
    var Stitcher = require(dirs.core + 'dataStitcher');
    var stitcher = new Stitcher(this.batcher);
    stitcher.prepareHistoricalData(this.init);
  }
  else if(mode === 'backtest')
    this.init();
}

util.makeEventEmitter(Actor);

Actor.prototype.init = function(done) {
  var methodName = config.tradingAdvisor.method;

  if(!fs.existsSync(dirs.methods + methodName + '.js'))
    util.die('Gekko doesn\'t know the method ' + methodName);

  log.info('\t', 'Using the trading method: ' + methodName);

  var method = require(dirs.methods + methodName);

  // bind all trading method specific functions
  // to the Consultant.
  var Consultant = require(dirs.core + 'baseTradingMethod');

  _.each(method, function(fn, name) {
    Consultant.prototype[name] = fn;
  });

  this.method = new Consultant;

  this.batcher
    .on('candle', this.processCustomCandle)

  this.method
    .on('advice', this.relayAdvice);

  this.done();
}

// HANDLERS
// process the 1m candles
Actor.prototype.processCandle = function(candle, done) {
  this.batcher.write([candle]);
  done();
}

// propogate a custom sized candle to the trading method
Actor.prototype.processCustomCandle = function(candle) {
  this.method.tick(candle);
}

// pass through shutdown handler
Actor.prototype.finish = function(done) {
  this.method.finish(done);
}

// EMITTERS
Actor.prototype.relayAdvice = function(advice) {
  this.emit('advice', advice);
}


module.exports = Actor;
