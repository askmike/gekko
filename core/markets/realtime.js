var _ = require('lodash');

var util = require('../util');
var dirs = util.dirs();

var config = util.getConfig();

const slug = config.watch.exchange.toLowerCase();
const Trader = require(dirs.exchanges + slug);
const exchange = Trader.getCapabilities();

if(!exchange)
  util.die(`Unsupported exchange: ${config.watch.exchange.toLowerCase()}`)

var exchangeChecker = require(util.dirs().core + 'exchangeChecker');

var error = exchangeChecker.cantMonitor(config.watch);
if(error)
  util.die(error, true);

module.exports = require(dirs.budfox + 'budfox');