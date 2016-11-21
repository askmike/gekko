var util = require('../../core/util');
var _ = require('lodash');
var fs = require('fs');
var toml = require('toml');

var config = util.getConfig();
var dirs = util.dirs();
var log = require(dirs.core + 'log');
var CandleBatcher = require(dirs.core + 'candleBatcher');

var moment = require('moment');

var Actor = function(done) {
  _.bindAll(this);

  this.done = done;

  this.batcher = new CandleBatcher(config.tradingAdvisor.candleSize);

  this.methodName = config.tradingAdvisor.method;

  this.generalizeMethodSettings();

  this.setupTradingMethod();

  var mode = util.gekkoMode();

  if(mode === 'realtime') {
    var Stitcher = require(dirs.tools + 'dataStitcher');
    var stitcher = new Stitcher(this.batcher);
    stitcher.prepareHistoricalData(done);
  } else if(mode === 'backtest')
    done();
}

util.makeEventEmitter(Actor);

Actor.prototype.generalizeMethodSettings = function() {
  // method settings can be either part of the main config OR a seperate
  // toml configuration file. In case of the toml config file we need to
  // parse and attach to main config object

  // config already part of 
  if(config[this.methodName]) {
    log.warn('\t', 'Config already has', this.methodName, 'parameters. Ignoring toml file');
    return;
  }

  var tomlFile = dirs.config + 'strategies/' + this.methodName + '.toml';

  if(!fs.existsSync(tomlFile)) {
    log.warn('\t', 'toml configuration file not found.');
    return;
  }

  var rawSettings = fs.readFileSync(tomlFile);
  config[this.methodName] = toml.parse(rawSettings);

  util.setConfig(config);
}

Actor.prototype.setupTradingMethod = function() {

  if(!fs.existsSync(dirs.methods + this.methodName + '.js'))
    util.die('Gekko doesn\'t know the method ' + this.methodName);

  log.info('\t', 'Using the trading method: ' + this.methodName);

  var method = require(dirs.methods + this.methodName);

  // bind all trading method specific functions
  // to the Consultant.
  var Consultant = require('./baseTradingMethod');

  _.each(method, function(fn, name) {
    Consultant.prototype[name] = fn;
  });

  this.method = new Consultant;
  this.method
    .on('advice', this.relayAdvice);

  this.batcher
    .on('candle', this.processCustomCandle)
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
