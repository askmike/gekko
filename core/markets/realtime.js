var _ = require('lodash');

var util = require('../util');
var dirs = util.dirs();

var exchangeChecker = require(dirs.core + 'exchangeChecker');
var config = util.getConfig();

const slug = config.watch.exchange.toLowerCase();
const exchange = exchangeChecker.getExchangeCapabilities(slug);

if(!exchange)
  util.die(`Unsupported exchange: ${slug}`)

var error = exchangeChecker.cantMonitor(config.watch);
if(error)
  util.die(error, true);

module.exports = require(dirs.budfox + 'budfox');