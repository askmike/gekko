var _ = require('lodash');
var util = require('../../core/util.js');
var log = require(`${util.dirs().core}log`);

var handle = require('./handle');
var mongoUtil = require('./util');

var Reader = function Reader () {
  _.bindAll(this);
  this.db = handle;
  this.collection = this.db.collection(mongoUtil.settings.historyCollection);
  this.pair = mongoUtil.settings.pair.join('_');
}

// returns the furtherst point (up to `from`) in time we have valid data from
Reader.prototype.mostRecentWindow = function mostRecentWindow (from, to, next) {
  var mFrom = from.unix();
  var mTo = to.unix();

  var maxAmount = mTo - mFrom + 1;

  // Find some documents
  this.collection.find({ pair: this.pair, start: { $gte: mFrom, $lte: mTo } }).sort({ start: -1 }, (err, docs) => {
    if (err) {
      return util.die('DB error at `mostRecentWindow`');
    }
    // no candles are available
    if (docs.length === 0) {
      log.debug('no candles are available');
      return next(false);
    }

    if (docs.length === maxAmount) {
      // full history is available!
      log.debug('full history is available!');
      return next({
        mFrom,
        mTo
      });
    }

    // we have at least one gap, figure out where
    var mostRecent = _.first(docs).start;

    var gapIndex = _.findIndex(docs, (r, i) => r.start !== mostRecent - i * 60);

    // if there was no gap in the records, but
    // there were not enough records.
    if (gapIndex === -1) {
      var leastRecent = _.last(docs).start;
      return next({
        from: leastRecent,
        to: mostRecent
      });
    }

    // else return mostRecent and the
    // the minute before the gap
    return next({
      from: docs[gapIndex - 1].start,
      to: mostRecent
    });
  })
}

Reader.prototype.get = function get (from, to, what, next) { // returns all fields in general
  // Find some documents
  this.collection.find({ pair: this.pair, start: { $gte: from, $lte: to } }).sort({ start: 1 }, (err, docs) => {
    if (err) {
      return util.die('DB error at `get`');
    }
    return next(null, docs);
  });
}

Reader.prototype.count = function fCount (from, to, next) {
  this.collection.count({ pair: this.pair, start: { $gte: from, $lte: to } }, (err, count) => {
    if (err) {
      return util.die('DB error at `count`');
    }
    return next(null, count);
  })
}

Reader.prototype.countTotal = function countTotal (next) {
  this.collection.count({ pair: this.pair }, (err, count) => {
    if (err) {
      return util.die('DB error at `countTotal`');
    }
    return next(null, count);
  })
}

Reader.prototype.getBoundry = function getBoundry (next) {
  this.collection.find({ pair: this.pair }, { start: 1 }).sort({ start: 1 }).limit(1, (err, docs) => {
    if (err) {
      return util.die('DB error at `getBoundry`');
    }
    var start = _.first(docs).start;

    this.collection.find({ pair: this.pair }, { start: 1 }).sort({ start: -1 }).limit(1, (err2, docs2) => {
      if (err2) {
        return util.die('DB error at `getBoundry`');
      }
      var end = _.first(docs2).start;
      return next(null, { first: start, last: end });
    });
    return null;
  });
}

Reader.prototype.tableExists = function(name, next) {
  return next(null, true); // Return true for backtest
}

Reader.prototype.close = function close () {
  this.db = null;
}

module.exports = Reader;
