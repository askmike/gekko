// Small writable stream wrapper that
// passes data to all `candleConsumers`.

var Writable = require('stream').Writable;
var _ = require('lodash');

var mode = require('./util').gekkoMode();

var Gekko = function(candleConsumers) {
  this.candleConsumers = candleConsumers;
  Writable.call(this, {objectMode: true});

  this.finalize = _.bind(this.finalize, this);
}

Gekko.prototype = Object.create(Writable.prototype, {
  constructor: { value: Gekko }
});

Gekko.prototype._write = function(chunk, encoding, _done) {
  var done = _.after(this.candleConsumers.length, _done);
  _.each(this.candleConsumers, function(c) {
    c.processCandle(chunk, done);
  });
}

Gekko.prototype.finalize = function() {
  _.each(this.candleConsumers, function(c) {
    c.finalize();
  });
}

module.exports = Gekko;