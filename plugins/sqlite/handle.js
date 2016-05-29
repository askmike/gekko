var _ = require('lodash');
var fs = require('fs');

var util = require('../../core/util.js');
var config = util.getConfig();

if(config.debug)
  var sqlite3 = require('sqlite3').verbose();
else
  var sqlite3 = require('sqlite3');

var plugins = require(util.dirs().gekko + 'plugins');

var version = _.find(plugins, {slug: 'sqliteWriter'}).version;

var dbName = config.watch.exchange + '_' + version + '.db';

var dir = config.sqliteWriter.directory;

if(!fs.existsSync(dir))
  fs.mkdirSync(dir);

var db = new sqlite3.Database(config.sqliteWriter.directory + dbName);

module.exports = db;