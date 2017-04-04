var config = require('../../core/util.js').getConfig();

var watch = config.watch;
var settings = {
  exchange: watch.exchange,
  pair: [watch.currency, watch.asset]
}

function useSingleDatabase() {
    return !!config.postgres.database;
}

function useLowerCaseTableNames() {
  return !config.postgresql.noLowerCaseTableName;
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
    var fullName = [name, settings.pair.join('_')].join('_');
    return useLowerCaseTableNames() ? fullName.toLowerCase() : fullName;
  },
  schema: function () {
    return config.postgresql.schema ? config.postgresql.schema : 'public';
  }
}
