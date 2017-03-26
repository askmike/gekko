var config = require('../../core/util.js').getConfig();

var watch = config.watch;
var exchangeLowerCase = watch.exchange.toLowerCase();

var settings = {
  exchange: watch.exchange,
  pair: [watch.currency, watch.asset],
  historyCollection: `${exchangeLowerCase}_candles`,
  adviceCollection: `${exchangeLowerCase}_advices`
};

module.exports = {
  settings
};
