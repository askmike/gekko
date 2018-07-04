const _ = require('lodash');

const util = require('../util');
const dirs = util.dirs();

const exchangeChecker = require(dirs.gekko + 'exchange/exchangeChecker');
const config = util.getConfig();

const slug = config.watch.exchange.toLowerCase();
const exchange = exchangeChecker.getExchangeCapabilities(slug);

if(!exchange)
  util.die(`Unsupported exchange: ${slug}`)

const error = exchangeChecker.cantMonitor(config.watch);
if(error)
  util.die(error, true);

module.exports = require(dirs.budfox + 'budfox');