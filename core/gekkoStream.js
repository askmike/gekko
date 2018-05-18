// Small writable stream wrapper that
// passes data to all `candleConsumers`.

var Writable = require('stream').Writable;
var _ = require('lodash');
var async = require('async');

var util = require('./util');
var env = util.gekkoEnv();
var mode = util.gekkoMode();

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
  var tradingMethod = _.find(
    this.candleConsumers,
    c => c.meta.name === 'Trading Advisor'
  );

  if(!tradingMethod)
    return this.shutdown();

  tradingMethod.finish(this.shutdown.bind(this));
}

Gekko.prototype.shutdown = function() {
  async.eachSeries(
    this.candleConsumers,
    function(c, callback) {
      if (c.finalize) c.finalize(callback);
      else callback();
    },
    function() {
      // If we are a child process, we signal to the parent to kill the child once it is done
      // so that is has time to process all remaining events (and send report data)
      if (env === 'child-process') process.send('done');
      else process.exit(0);
    }
  );
};

module.exports = Gekko;