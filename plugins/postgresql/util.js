var config = require('../../core/util.js').getConfig();

var watch = config.watch;
var settings = {
  exchange: watch.exchange,
  pair: [watch.currency, watch.asset]
}

module.exports = {
  settings: settings,
  table: function(name) {
    return [name, settings.pair.join('_')].join('_');
  }
}
