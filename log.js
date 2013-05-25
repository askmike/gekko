var moment = require('moment');
var fmt = require('util').format;
var _ = require('underscore');
var config = require('./config.js');

var Log = function() {
  this._debug = config.debug;
  _.bindAll(this);
};

Log.prototype = {
  _write: function(method, args, name) {
    if(!name)
      name = method.toUpperCase();
    

    var message = moment().format('YYYY-MM-DD HH:mm:ss');
    message += ' (' + name + '):\t';
    message += fmt.apply(null, args);

    console[method](message);
  },
  error: function() {
    this._write('error', arguments);
  },
  warn: function() {
    this._write('warn', arguments);
  },
  info: function() {
    this._write('info', arguments);
  },
  debug: function() {
    if(this._debug)
      this._write('info', arguments, 'DEBUG');  
  }
}

module.exports = new Log;