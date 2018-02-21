// Small writable stream wrapper that
// passes data to all `candleConsumers`.

const Writable = require('stream').Writable;
const _ = require('lodash');
const async = require('async');
const moment = require('moment');

const util = require('./util');
const env = util.gekkoEnv();
const mode = util.gekkoMode();
const config = util.getConfig();
const log = require(util.dirs().core + 'log');

var Gekko = function(candleConsumers) {
  this.candleConsumers = candleConsumers;
  Writable.call(this, {objectMode: true});

  this.finalize = _.bind(this.finalize, this);
}

Gekko.prototype = Object.create(Writable.prototype, {
  constructor: { value: Gekko }
});

if(config.debug) {
  Gekko.prototype._write = function(chunk, encoding, _done) {

    const start = moment();
    var relayed = false;
    var at = null;

    const timer = setTimeout(() => {
      if(!relayed)
        log.error([
          `The plugin "${at}" has not processed a candle for 0.5 seconds.`,
          `This will cause Gekko to slow down or stop working completely.`
        ].join(' '));
    }, 1000);

    const done = _.after(this.candleConsumers.length, () => {
      relayed = true;
      clearInterval(timer);
      _done();
    });
    _.each(this.candleConsumers, function(c) {
      at = c.meta.name;
      c.processCandle(chunk, done);
    });
  }
} else {
  // skip decoration
  Gekko.prototype._write = function(chunk, encoding, _done) {
    const done = _.after(this.candleConsumers.length, _done);
    _.each(this.candleConsumers, function(c) {
      c.processCandle(chunk, done);
    });
  }
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
    () => {
      // If we are a child process, we signal to the parent to kill the child once it is done
      // so that is has time to process all remaining events (and send report data)
      if (env === 'child-process') process.send('done');
      else process.exit(0);
    }
  );
};

module.exports = Gekko;