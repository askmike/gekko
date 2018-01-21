var _ = require('lodash');
var fs = require('fs');
var pg = require('pg');

var util = require('../../core/util.js');
var config = util.getConfig();
var dirs = util.dirs();

var log = require(util.dirs().core + 'log');
var postgresUtil = require('./util');

var adapter = config.postgresql;

// verify the correct dependencies are installed
var pluginHelper = require(dirs.core + 'pluginUtil');
var pluginMock = {
  slug: 'postgresql adapter',
  dependencies: config.postgresql.dependencies
};

var cannotLoad = pluginHelper.cannotLoad(pluginMock);
if(cannotLoad){
  util.die(cannotLoad);
}

var plugins = require(util.dirs().gekko + 'plugins');

var version = adapter.version;

var dbName = postgresUtil.database();

var mode = util.gekkoMode();

var connectionString = config.postgresql.connectionString+"/postgres";

var checkClient = new pg.Client(connectionString);
var client = new pg.Client(config.postgresql.connectionString+"/"+dbName);

/* Postgres does not have 'create database if not exists' so we need to check if the db exists first.
This requires connecting to the default postgres database first. Your postgres user will need appropriate rights. */
checkClient.connect(function(err){
  if(err){
    util.die(err);
  }
  log.debug("Check database exists: "+dbName);
  query = checkClient.query("select count(*) from pg_catalog.pg_database where datname = $1",[dbName], 
    (err, res) => {
      if(err) {
        util.die(err);
      }
      if(res.rows[0].count == 0){ //database does not exist
        log.debug("Database "+dbName+" does not exist");
        if(mode === 'realtime') { //create database if not found
          log.debug("Creating database "+dbName);
          checkClient.query("CREATE DATABASE "+dbName,function(err){
            if(err){
              util.die(err);
            }else{
              client.connect(function(err){
                if(err){
                  util.die(err);
                }
                log.debug("Postgres connected to "+dbName);
              });
            }
          });
        }else if(mode === 'backtest') {
          util.die(`History does not exist for exchange ${config.watch.exchange}.`);
        }else{
          util.die(`Start gekko first in realtime mode to create tables. You are currently in the '${mode}' mode.`);
        }
      }else{ //database exists
        log.debug("Database exists: "+dbName);
        client.connect(function(err){
          checkClient.end();
          if(err){
            util.die(err);
          }
          log.debug("Postgres connected to "+dbName);
        });
      }  
    });
});

module.exports = client;
