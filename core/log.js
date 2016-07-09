/*

  Lightweight logger, print everything that is send to error, warn
  and messages to stdout (the terminal). If config.debug is set in config
  also print out everything send to debug.

*/

var moment = require('moment');
var fmt = require('util').format;
var _ = require('lodash');
var util = require('./util');
var debug = util.getConfig().debug;

var sendIPC = function() {
  var IPCEE = require('relieve').IPCEE
  var ipc = IPCEE(process);

  var send = function(method) {
    return function() {
      var args = _.toArray(arguments);
      ipc.send('log', args.join(' '));
    }
  }

  return {
    error: send('error'),
    warn: send('warn'),
    info: send('info')
  }
}

var Log = function() {
  _.bindAll(this);
  this.env = util.gekkoEnv();
  if(this.env === 'standalone')
    this.output = console;
  else if(this.env === 'child-process')
    this.output = sendIPC();
};

Log.prototype = {
  _write: function(method, args, name) {
    if(!name)
      name = method.toUpperCase();

    var message = moment().format('YYYY-MM-DD HH:mm:ss');
    message += ' (' + name + '):\t';
    message += fmt.apply(null, args);

    this.output[method](message);
  },
  error: function() {
    this._write('error', arguments);
  },
  warn: function() {
    this._write('warn', arguments);
  },
  info: function() {
    this._write('info', arguments);
  }
}

if(debug)
  Log.prototype.debug = function() {
    this._write('info', arguments, 'DEBUG');  
  }
else
  Log.prototype.debug = _.noop;

module.exports = new Log;