// Small writable stream wrapper that
// passes data to all `candleConsumers`.

var Writable = require('stream').Writable;
var _ = require('lodash');

var Gekko = function(candleConsumers) {
  this.candleConsumers = candleConsumers;
  Writable.call(this, {objectMode: true});
}

Gekko.prototype = Object.create(Writable.prototype, {
  constructor: { value: Gekko }
});

Gekko.prototype._write = function(chunk, encoding, callback) {
  // TODO: use different ticks and pause until all are done
  _.each(this.candleConsumers, function(c) {
    c.processCandle(chunk);
  });

  callback();
}

module.exports = Gekko;