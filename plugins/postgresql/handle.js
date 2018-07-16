const _ = require('lodash');
const fs = require('fs');

const util = require('../../core/util.js');
const config = util.getConfig();
const dirs = util.dirs();

const log = require(util.dirs().core + 'log');
const postgresUtil = require('./util');

const adapter = config.postgresql;

// verify the correct dependencies are installed
const pluginHelper = require(dirs.core + 'pluginUtil');
const pluginMock = {
  slug: 'postgresql adapter',
  dependencies: config.postgresql.dependencies
}

const cannotLoad = pluginHelper.cannotLoad(pluginMock);
if(cannotLoad) {
  util.die(cannotLoad);
}

const pg = require('pg');

const version = adapter.version;

const dbName = postgresUtil.database();

const mode = util.gekkoMode();

const connectionString = config.postgresql.connectionString;

const checkClient = new pg.Pool({
  connectionString: connectionString + '/postgres',
});
const pool = new pg.Pool({
  connectionString: connectionString + '/' + dbName,
});

// We need to check if the db exists first.
// This requires connecting to the default
// postgres database first. Your postgres
// user will need appropriate rights.
checkClient.connect((err, client, done) => {
  if(err) {
    util.die(err);
  }

  log.debug("Check database exists: " + dbName);
  client.query("select count(*) from pg_catalog.pg_database where datname = $1", [dbName],
    (err, res) => {
      if(err) {
        util.die(err);
      }

      if(res.rows[0].count !== '0') {
        // database exists
        log.debug("Database exists: " + dbName);
        log.debug("Postgres connection pool is ready, db " + dbName);
        upsertTables();
        done();
        return;
      }

      // database dot NOT exist

      if(mode === 'backtest') {
        // no point in trying to backtest with
        // non existing data.
        util.die(`History does not exist for exchange ${config.watch.exchange}.`);
      }

      createDatabase(client, done);
    });
});

const createDatabase = (client, done) => {
  client.query("CREATE DATABASE " + dbName, err => {
    if(err) {
      util.die(err);
    }

    log.debug("Postgres connection pool is ready, db " + dbName);
    done();
    upsertTables();
  });
}

const upsertTables = () => {
  const upsertQuery =
    `CREATE TABLE IF NOT EXISTS
    ${postgresUtil.table('candles')} (
      id BIGSERIAL PRIMARY KEY,
      start integer UNIQUE,
      open double precision NOT NULL,
      high double precision NOT NULL,
      low double precision NOT NULL,
      close double precision NOT NULL,
      vwp double precision NOT NULL,
      volume double precision NOT NULL,
      trades INTEGER NOT NULL
    );`;

  pool.query(upsertQuery, (err) => {
    if(err) {
      util.die(err);
    }
  });
}


module.exports = pool;
