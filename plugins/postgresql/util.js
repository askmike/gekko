var config = require('../../core/util.js').getConfig();

var watch = config.watch;
var settings = {
  exchange: watch.exchange,
  pair: [watch.currency, watch.asset]
}

function useLowerCaseTableNames() {
  return !config.postgresql.noLowerCaseTableName;
}

module.exports = {
  settings: settings,
  table: function(name) {
    var fullName = [name, settings.pair.join('_')].join('_');
    return useLowerCaseTableNames() ? fullName.toLowerCase() : fullName;
  }
}
