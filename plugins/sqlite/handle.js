var _ = require('lodash');
var fs = require('fs');

var util = require('../../core/util.js');
var config = util.getConfig();

if(config.debug)
  var sqlite3 = require('sqlite3').verbose();
else
  var sqlite3 = require('sqlite3');

var plugins = require(util.dirs().gekko + 'plugins');

var version = config.adapter.version;

var dbName = config.watch.exchange.toLowerCase() + '_' + version + '.db';
var dir = config.adapter.directory;

var fullPath = [dir, dbName].join('/');

var mode = util.gekkoMode();
if(mode === 'realtime') {

  if(!fs.existsSync(dir))
    fs.mkdirSync(dir);


} else if(mode === 'backtest') {

  if(!fs.existsSync(dir))
    util.die('History directory does not exist.');

  if(!fs.existsSync(fullPath))
    util.die(`History database does not exist for exchange ${config.watch.exchange} at version ${version}.`);
}
  

var db = new sqlite3.Database(fullPath);

module.exports = db;