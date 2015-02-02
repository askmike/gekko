var moment = require('moment');
var _ = require('lodash');
var path = require('path');
var fs = require('fs');
var semver = require('semver');

var _config = false;
var _package = false;
var _nodeVersion = false;

// helper functions
var util = {
  getConfig: function() {
    if(_config)
      return _config;

    var configFile = path.resolve(util.getArgument('config') || util.dirs().gekko + 'config');
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
  getArgument: function(argument) {
    var ret;
    _.each(process.argv, function(arg) {
      // check if it's a configurable
      var pos = arg.indexOf(argument + '=');
      if(pos !== -1)
        ret = arg.substr(argument.length + 1);
      // check if it's a toggle
      pos = arg.indexOf('-' + argument);
      if(pos !== -1 && !ret)
        ret = true;
    });
    return ret;
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
  // calculate the average trade price out of a sample of trades.
  // The sample consists of all trades that happened after the treshold.
  calculatePriceSince: function(treshold, trades) {
    var sample = [];
    _.every(trades, function(trade) {
      if(moment.unix(trade.date) < treshold)
        return false;

      var price = parseFloat(trade.price);
      sample.push(price);
      return true;
    });

    return util.average(sample);
  },
  // calculate the average trade price out of a sample of trades.
  // The sample consists of all trades that happened before the treshold.
  calculatePriceTill: function(treshold, trades) {
    var sample = [];
    _.every(trades, function(trade) {
      if(moment.unix(trade.date) > treshold)
        return false;

      var price = parseFloat(trade.price);
      sample.push(price);
      return true;
    });

    return util.average(sample);
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
    console.log('Gekko version:', 'v' + util.getVersion());
    console.log('Nodejs version:', process.version);
  },
  die: function(m) {
    if(m) {
      console.log('\n\nGekko encountered an error and can\'t continue');
      console.log('\nMeta debug info:\n');
      util.logVersion();
      console.log('\nError:\n');
      console.log(m, '\n\n');
    }
    process.kill();
  },
  dirs: function() {
    var ROOT = __dirname + '/../';

    return {
      gekko: ROOT,
      core: ROOT + 'core/',
      plugins: ROOT + 'plugins/',
      methods: ROOT + 'methods/',
      budfox: ROOT + 'core/budfox/'
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

  // @link https://stackoverflow.com/questions/21124701/creating-a-node-js-readable-stream-from-a-javascript-object-the-simplest-possi#answer-21127245
  StringifyStream: (function() {
    var StringifyStream = function() {
        require('stream').Transform.call(this);
        this._readableState.objectMode = false;
        this._writableState.objectMode = true;
    }
    require('util').inherits(StringifyStream, require('stream').Transform);
    StringifyStream.prototype._transform = function(obj, encoding, cb){
        this.push(JSON.stringify(obj) + '\n');
        cb();
    };

    return StringifyStream;
  })(),
  // TODO:
  gekkoMode: function() {
    return 'realtime';
  },
}

var config = util.getConfig();

module.exports = util;