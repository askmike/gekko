var log = require('../core/log');
var moment = require('moment');
var _ = require('lodash');
var util = require('../core/util.js');
var config = util.getConfig();
var adviceLoggerConfig = config.adviceLogger;

var Actor = function() {
  this.price = 'N/A';
  this.marketTime = {format: function() {return 'N/A'}};
  _.bindAll(this);
}

Actor.prototype.processCandle = function(candle, done) {
  this.price = candle.close;
  this.marketTime = candle.start;

  done();
};

Actor.prototype.processAdvice = function(advice) {
  if (adviceLoggerConfig.muteSoft && advice.recommendation == 'soft') return;
  console.log()
  log.info('We have new trading advice!');
  log.info('\t Position:', advice.recommendation);
  log.info('\t Market price:', this.price);
  log.info('\t Based on market time:', this.marketTime.format('YYYY-MM-DD HH:mm:ss'));
  console.log()
};

Actor.prototype.finalize = function(advice, done) {
  // todo
  done();
};

module.exports = Actor;
