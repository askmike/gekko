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

var Gekko = function(plugins) {
  this.plugins = plugins;
  this.candleConsumers = plugins
    .filter(plugin => plugin.processCandle);
  Writable.call(this, {objectMode: true});

  this.producers = this.plugins
    .filter(p => p.meta.emits);

  this.finalize = _.bind(this.finalize, this);
}

Gekko.prototype = Object.create(Writable.prototype, {
  constructor: { value: Gekko }
});

if(config.debug && mode !== 'importer') {
  // decorate with more debug information
  Gekko.prototype._write = function(chunk, encoding, _done) {

    if(chunk.isFinished) {
      return this.finalize();
    }

    const start = moment();
    var relayed = false;
    var at = null;

    const timer = setTimeout(() => {
      if(!relayed)
        log.error([
          `The plugin "${at}" has not processed a candle for 1 second.`,
          `This will cause Gekko to slow down or stop working completely.`
        ].join(' '));
    }, 1000);

    const flushEvents = _.after(this.candleConsumers.length, () => {
      relayed = true;
      clearInterval(timer);
      this.flushDefferedEvents();
      _done();
    });
    _.each(this.candleConsumers, function(c) {
      at = c.meta.name;
      c.processCandle(chunk, flushEvents);
    }, this);
  }
} else {
  // skip decoration
  Gekko.prototype._write = function(chunk, encoding, _done) {
    if(chunk.isFinished) {
      return this.finalize();
    }

    const flushEvents = _.after(this.candleConsumers.length, () => {
      this.flushDefferedEvents();
      _done();
    });
    _.each(this.candleConsumers, function(c) {
      c.processCandle(chunk, flushEvents);
    }, this);
  }
}

Gekko.prototype.flushDefferedEvents = function() {
  const broadcasted = _.find(
    this.producers,
    producer => producer.broadcastDeferredEmit()
  );

  // If we braodcasted anything we might have
  // triggered more events, recurse until we
  // have fully broadcasted everything.
  if(broadcasted)
    this.flushDefferedEvents();
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
  this.end();
  async.eachSeries(
    this.plugins,
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