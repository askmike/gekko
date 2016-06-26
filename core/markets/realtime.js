var _ = require('lodash');

var util = require('../util');
var dirs = util.dirs();

var config = util.getConfig();

var exchanges = require(dirs.gekko + 'exchanges');
var exchange = _.find(exchanges, function(e) {
  return e.slug === config.watch.exchange.toLowerCase();
});

if(!exchange)
  util.die(`Unsupported exchange: ${config.watch.exchange.toLowerCase()}`)

var exchangeChecker = require(util.dirs().core + 'exchangeChecker');

var error = exchangeChecker.cantMonitor(config.watch);
if(error)
  util.die(error, true);

module.exports = require(dirs.budfox + 'budfox');