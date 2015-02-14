// Small writable stream wrapper that
// passes data to all `candleProcessors`.

var Writable = require('stream').Writable;
var _ = require('lodash');

var Gekko = function(candleProcessors) {
  this.candleProcessors = candleProcessors;
  Writable.call(this, {objectMode: true});
}

Gekko.prototype = Object.create(Writable.prototype, {
  constructor: { value: Gekko }
});

Gekko.prototype._write = function(chunk, encoding, callback) {
  _.each(this.candleProcessors, function(p) {
    p.processCandle(chunk);
  });

  callback();
}

module.exports = Gekko;