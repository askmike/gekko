var config = require('../../core/util.js').getConfig();

var watch = config.watch;
var settings = {
  exchange: watch.exchange,
  pair: [watch.currency, watch.asset]
}

function useSingleDatabase() {
    return !!config.postgres.database;
}

module.exports = {
  settings: settings,
  useSingleDatabase: useSingleDatabase,
  database: function () {
    return useSingleDatabase() ?
      config.postgres.database :
      config.watch.exchange.toLowerCase();
  },
  table: function (name) {
    if (useSingleDatabase()) {
      name = watch.exchange + '_' + name;
    }
    return [name, settings.pair.join('_')].join('_');
  }
}
