var moment = require('moment');
var _ = require('lodash');
var path = require('path');
var fs = require('fs');
var semver = require('semver');

var program = require('commander');

var _config = false;
var _package = false;
var _nodeVersion = false;

var _args = false;

// helper functions
var util = {
  getConfig: function() {
    if(_config)
      return _config;
    var configFile = path.resolve(program.config || util.dirs().gekko + 'config.js');

    if(!fs.existsSync(configFile))
      util.die('Cannot find a config file.');

    _config = require(configFile);
    return _config;
  },
  // overwrite the whole config
  setConfig: function(config) {
    _config = config;
  },
  setConfigProperty: function(parent, key, value) {
    if(parent)
      _config[parent][key] = value;
    else
      _config[key] = value;
  },
  getVersion: function() {
    return util.getPackage().version;
  },
  getPackage: function() {
    if(_package)
      return _package;

    _package = JSON.parse( fs.readFileSync(__dirname + '/../package.json', 'utf8') );
    return _package;
  },
  getRequiredNodeVersion: function() {
    return util.getPackage().engines.node;
  },
  recentNode: function() {
    var required = util.getRequiredNodeVersion();
    return semver.satisfies(process.version, required);
  },
  // check if two moments are corresponding
  // to the same time
  equals: function(a, b) {
    return !(a < b || a > b)
  },
  msToMin: function(ms) {
    return Math.round(ms / 60 / 1000);
  },
  minToMs: function(min) {
    return min * 60 * 1000;
  },
  toMicro: function(moment) {
    return moment.format('X') * 1000 * 1000;
  },
  intervalsAgo: function(amount) {
    return moment().utc().subtract('minutes', config.EMA.interval * amount);
  },
  minAgo: function(moment) {
    return moment.duraction( moment().utc().subtract(moment) ).asMinutes();
  },
  average: function(list) {
    var total = _.reduce(list, function(m, n) { return m + n }, 0);
    return total / list.length;
  },
  calculateTimespan: function(a, b) {
    if(a < b)
      return b.diff(a);
    else
      return a.diff(b);
  },
  defer: function(fn) {
    return function(args) {
      var args = _.toArray(arguments);
      return _.defer(function() { fn.apply(this, args) });
    }
  },
  logVersion: function() {
    return  `Gekko version: v${util.getVersion()}`
    + `\nNodejs version: ${process.version}`;
  },
  die: function(m, soft) {
    if(m) {
      if(soft) {
        console.log('\n', m, '\n\n');
      } else {
        console.log('\n\nGekko encountered an error and can\'t continue');
        console.log('\nError:\n');
        console.log(m, '\n\n');
        console.log('\nMeta debug info:\n');
        console.log(util.logVersion());
        console.log('');
      }
    }
    process.exit(0);
  },
  dirs: function() {
    var ROOT = __dirname + '/../';

    return {
      gekko: ROOT,
      core: ROOT + 'core/',
      exchanges: ROOT + 'exchanges/',
      plugins: ROOT + 'plugins/',
      methods: ROOT + 'methods/',
      budfox: ROOT + 'core/budfox/',
      importers: ROOT + 'importers/exchanges/'
    }
  },
  inherit: function(dest, source) {
    require('util').inherits(
      dest,
      source
    );
  },
  makeEventEmitter: function(dest) {
    util.inherit(dest, require('events').EventEmitter);
  },
  // TODO:
  gekkoMode: function() {
    if(program.importer)
      return 'importer';
    else if(program.backtest)
      return 'backtest';
    else
      return 'realtime';
  }
}

program
  .version(util.logVersion())
  .option('-c, --config <file>', 'Config file')
  .option('-b, --backtest', 'backtest')
  .option('-i, --importer', 'importer')
  .parse(process.argv);

var config = util.getConfig();

module.exports = util;