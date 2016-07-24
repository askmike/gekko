var log = require('../../log');
var moment = require('moment');
var _ = require('lodash');

var Actor = function() {
  this.price = 'N/A';
  this.marketTime = {format: function() {return 'N/A'}};
  _.bindAll(this);

  this.meta = {
    name: 'spy'
  }
}

// Actor.prototype.processCandle = function(candle, done) {
//   this.price = candle.close;
//   this.marketTime = candle.start;

//   done();
// };

// Actor.prototype.processAdvice = function(advice) {
//   log.info('We have new trading advice!');
//   log.info('\t Position:', advice.recommandation);
//   log.info('\t Market price:', this.price);
//   log.info('\t Based on market time:', this.marketTime.format('YYYY-MM-DD HH:mm:ss'));
// };

Actor.prototype.finalize = function(advice) {
  // todo
};

module.exports = Actor;