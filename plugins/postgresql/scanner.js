const _ = require('lodash');
const async = require('async');
var pg = require('pg');

const util = require('../../core/util.js');
const config = util.getConfig();
const dirs = util.dirs();
var postgresUtil = require('./util');

var connectionString = config.postgresql.connectionString;


module.exports = done => {
  var scanClient = new pg.Client(connectionString+"/postgres");

  let markets = [];

  scanClient.connect(function (err) {
    if(err){
      util.die(err);
    }

    var query = scanClient.query("select datname from pg_database", function (err, result) {

      async.each(result.rows, (dbRow, next) => {

        var scanTablesClient = new pg.Client(connectionString + "/" + dbRow.datname);
        var dbName = dbRow.datname;

        scanTablesClient.connect(function (err) {
          if (err) {
            return next();
          }

          var query = scanTablesClient.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema='${postgresUtil.schema()}';
          `, function(err, result) {
            if (err) {
              return util.die('DB error at `scanning tables`');
            }

            _.each(result.rows, table => {
              let parts = table.table_name.split('_');
              let first = parts.shift();
              if(first === 'candles')
                markets.push({
                  exchange: dbName,
                  currency: _.first(parts),
                  asset: _.last(parts)
                });
            });

            scanTablesClient.end();

            next();
          });
        });

      },
      // got all tables!
      err => {
        scanClient.end();
        done(err, markets);
      });

    });

  });
}