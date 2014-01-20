var log = require('../core/log');
var moment = require('moment');
var _ = require('lodash');

var Actor = function() {
  _.bindAll(this);
}

Actor.prototype.processTrade = function(trade) {
  this.price = trade.price;
  this.marketTime = moment.unix(trade.date);
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