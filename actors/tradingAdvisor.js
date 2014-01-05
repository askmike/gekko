var util = require('../core/util');
var log = require('../core/log');
var _ = require('lodash');

var config = util.getConfig();
var Consultant = require('../methods/' + config.tradingAdvisor.method.toLowerCase().split(' ').join('-'));

var Actor = function() {
  _.bindAll(this);

  log.info('\t', 'Using ' + config.tradingAdvisor.methodSlug + ' method');

  this.method = new Consultant;
}

Actor.prototype.processHistory = function(data) {
  this.method.init(data);
}

Actor.prototype.processCandle = function(candle) {
  this.method.update(candle);
}

module.exports = Actor;