var config = require('../../core/util.js').getConfig();

var watch = config.watch;
if(watch) {
  var settings = {
    exchange: watch.exchange,
    pair: [watch.currency, watch.asset]
  }
}

/**
 * Returns true if we use single database where
 * all our tables are stored. The default is to store
 * every exchange into it's own db.
 *
 * Set config.postgresql.database to use single db setup
 */
function useSingleDatabase() {
    return !!config.postgresql.database;
}

/**
 * Postgres has tables in lowercase if you don't
 * escape their names. Which we don't and so let's
 * just lowercase them.
 */
function useLowerCaseTableNames() {
  return !config.postgresql.noLowerCaseTableName;
}

module.exports = {
  settings: settings,

  // true if we have single db setup (see postrgesql.database config key)
  useSingleDatabase: useSingleDatabase,

  // returns DB name (depends on single db setup)
  database: function () {
    return useSingleDatabase() ?
      config.postgresql.database :
      config.watch.exchange.toLowerCase();
  },

  // returns table name which can be different if we use
  // single or multiple db setup.
  table: function (name) {
    if (useSingleDatabase()) {
      name = watch.exchange + '_' + name;
    }
    var fullName = [name, settings.pair.join('_')].join('_');
    return useLowerCaseTableNames() ? fullName.toLowerCase() : fullName;
  },

  // postgres schema name. defaults to 'public'
  schema: function () {
    return config.postgresql.schema ? config.postgresql.schema : 'public';
  }
}
