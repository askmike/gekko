var log = require('../../core/log');
var moment = require('moment');
var _ = require('lodash');

var Actor = function(done) {
  _.bindAll(this);

  this.name = 'Advice logger';

  done();
}

Actor.prototype.init = function(history) {
  // process last candle as now
  this.processCandle(_.last(history.candles));
};

Actor.prototype.processCandle = function(candle) {
  this.price = candle.c;

  // we got a 1m candle, last time is 60 seconds after it.
  // note that time is in UTC, we need to convert to local
  this.marketTime = candle.start.clone().local().add('m', 1);
};

Actor.prototype.processAdvice = function(advice) {
  console.log()
  log.info('We have new trading advice!');
  log.info('\t Position to take:', advice.recommandation);
  log.info('\t Market price:', this.price);
  log.info('\t Based on market time:', this.marketTime.format('YYYY-MM-DD HH:mm:ss'));
  console.log()
};

module.exports = Actor;