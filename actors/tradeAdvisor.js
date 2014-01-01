var util = require('../core/util');
var log = require('../core/log');
var _ = require('lodash');

var config = util.getConfig();
var Consultant = require('../methods/' + config.tradingMethod.toLowerCase().split(' ').join('-'));

var Actor = function(done) {
  _.bindAll(this);
  this.name = 'Trade advisor';
  this.description = 'Calculate trading advice based on the ' + config.tradingMethod;

  this.method = new Consultant;
  done();
}

Actor.prototype.init = function(data) {
  this.method.init(data);
}

Actor.prototype.processCandle = function(candle) {
  this.method.update(candle);
}

module.exports = Actor;