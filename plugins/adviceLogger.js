var log = require('../core/log');
var moment = require('moment');
var _ = require('lodash');

var Actor = function() {
  this.price = 'N/A';
  this.marketTime = {format: function() {return 'N/A'}};
  _.bindAll(this);
}

Actor.prototype.processCandle = function(candle) {
  this.price = candle.close;
  this.marketTime = candle.start;
};

Actor.prototype.processAdvice = function(advice) {
  console.log()
  log.info('We have new trading advice!');
  log.info('\t Position:', advice.recommandation);
  log.info('\t Market price:', this.price);
  log.info('\t Based on market time:', this.marketTime.format('YYYY-MM-DD HH:mm:ss'));
  console.log()
};

module.exports = Actor;