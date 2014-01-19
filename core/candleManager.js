
// This serves as an abstraction layer for Gekko:
// we store all candles as 1m candles in a
// database per day. Using this method you can
//
// - Store new candles in the database based
//   on fetched trade data.
// - Get candles out of a database.
//
// TODO:
//
//    This script does three things:
//    - calculate 1m candles and add empty ones.
//    - calculate what candle should go / come from
//      what daily database.
//    - communicates with the datastore (nedb)
//      about inserts / gets.
//
//    These should live in 3 seperate modules.
//
// Notes:
//
//  - All candles are stored in daily format
//    per exchange per market per day (in UTC).
//  - it adds empty candles to fill gaps, it
//    does this to differentiate between times
//    with no volume and missing data.
//  - because of this it expects empty candles
//    in the files, else it assumes there is
//    missing data (and the db is most likely
//    discarded as corrupt).
//  - It trusts the trade data provider to send
//    enough data: if the tradeFetcher doesn't
//    keep up with the trades coming in, this
//    manager cannot tell that the data is
//    corrupted. And thus assumes it is not.
//
// Known issues:
//  - The manager is unable to correctly process
//    trade fetches that span over more than 2 days
//    (after filtering out all the trade data already
//    stored on disk).
//  - The leftovers are not persisted to disk: Gekko
//    uses leftovers to keep track of trades that
//    did not span a full minute in a certain fetch.
//    This makes sure we also store fully aggregated
//    minutes between two fetches. However this state
//    is stored in memory and is lost on restart. This
//    also means that we potentially lose accuracy in
//    the rare case that *on restart* the first fetches
//    are since the next-to-be-stored-candle but maybe
//    not since its start.

var _ = require('lodash');
var moment = require('moment');
var utc = moment.utc;
var log = require('./log.js');
var fs = require('fs');
var nedb = require('nedb');
var async = require('async');

var util = require('./util');
var config = util.getConfig();
var backtest = config.backtest;
var tradingAdvisor = config.tradingAdvisor;

var equals = util.equals;

// even though we have leap seconds, every
// day has the same amount of minutes
var MINUTES_IN_DAY = 1439;

var Manager = function() {
  _.bindAll(this);

  this.historyPath = config.history.directory || './history/';
  this.days = {};

  // This is vital state, think out all scenarios
  // of what this could be, based on:
  //  - partial history
  //  - full history
  //  - fetch start
  //  - backtest enabled
  if(backtest.enabled)
    this.startTime = moment(backtest.from).utc()
  else
    this.startTime = utc();

  // set the start current day
  this.setDay(this.startTime);

  this.state = 'building history';
  // 'realtime updating'

  // make sure the historical folder exists
  if(!fs.existsSync(this.historyPath))
    fs.mkdirSync(this.historyPath);

  if(!fs.existsSync(this.historyPath))
    throw 'Gekko is unable to save historical data, do I have sufficient rights?';

  this.on('processed', function() {
    log.debug('Processed trades, sleeping for', this.fetch.next.m.fromNow(true) + '...');
  })
    // .on('full history build', this.emitRealtime)
};

var Util = require('util');
var EventEmitter = require('events').EventEmitter;
Util.inherits(Manager, EventEmitter);

// return an array of moms representing all required
Manager.prototype.requiredDays = function(timespan, from) {
  var days = [];

  if(!from)
    var start = this.current.day.clone();
  else
    var start = from.clone();
  var to = start.clone().subtract('m', timespan).startOf('day');

  while(start >= to) {
    days.push(this.mom(start.clone()));
    start.subtract('d', 1);
  };

  return days;
}


Manager.prototype.checkHistory = function() {
  log.debug('checking history');
  this.history = {}

  this.history.required = tradingAdvisor.enabled;
  if(this.history.required)
    this.history.timespan = tradingAdvisor.candleSize * tradingAdvisor.historySize; 
  else
    // load a only the current day
    this.history.timespan = 0;

  this.history.days = this.requiredDays(this.history.timespan);
  // load them
  _.each(this.history.days, this.loadDatabase, this);

  // verify
  async.each(
    this.history.days,
    this.setDatabaseMeta,
    _.bind(function() {
      this.checkDaysMeta();
      this.processHistoryStats();
    }, this)
  );
}

// create a new daily database and load it
Manager.prototype.createDatabase = function(mom) {
  if(mom.dayString in this.days && this.days[mom.dayString].handle)
    return log.debug('Skipping creation of already loaded database', mom.dayString);

  var filename = this.databaseName(mom);

  if(this.databaseExists(filename)) {
    log.debug('Skipping creation of already existing database', mom.dayString);
    return this.loadDatabase(mom);
  }

  log.debug('Creating a new daily database for day', mom.dayString);

  var day = {
    handle: new nedb({filename: filename, autoload: true}),
    time: mom.day,
    filename: filename,
    string: mom.dayString,

    // meta
    mounted: true,
    full: false,
    start: false,
    startCandle: false,
    end: false,
    endCandle: false,
    empty: true,
    exists: true
  };

  day.handle.ensureIndex({fieldName: 's', unique: true});

  this.days[day.string] = day;
}

// load a daily database and store it in this.days
Manager.prototype.loadDatabase = function(mom) {
  if(mom.dayString in this.days && this.days[mom.dayString].mounted)
    return log.debug('Skipping loading', mom.dayString, ', it already exists');

  var filename = this.databaseName(mom);

  var day = {
    handle: false,
    time: mom.day,
    filename: filename,
    string: mom.dayString,

    // meta
    mounted: false,
    full: false,
    start: false,
    startCandle: false,
    end: false,
    endCandle: false,
    empty: true,
    exists: false
  };

  this.days[day.string] = day;

  if(!this.databaseExists(day))
    return;

  day.mounted = true;
  day.exists = true;
  // neDB will throw if the DB is invalid
  // 
  // https://github.com/louischatriot/nedb/issues/117
  try {
    day.handle = new nedb({filename: filename, autoload: true});
  } catch(e) {
    util.die('Database file ' + filename + ' is corrupt, delete or rename that file and try again.');
  }
}

Manager.prototype.databaseExists = function(day) {
  if(_.isString(day))
    // we have a filename instead
    day = {filename: day};

  if(!day.filename)
    // we have a mom instead
    day.filename = this.databaseName(day);

  return fs.existsSync(day.filename);
}

// calculate stats of a daily database and store state
// in this.days
Manager.prototype.setDatabaseMeta = function(mom, cb) {
  var day = this.days[mom.dayString];

  if(!day.exists)
    return cb();

  day.handle.find({s: {$gt: -1}}, _.bind(function(err, minutes) {
    if(err)
      return cb(err);

    day.minutes = _.size(minutes);

    if(!day.minutes)
      return cb();

    // this day has candles, store stats
    day.empty = false;
    day.full = day.minutes === MINUTES_IN_DAY;
    day.startCandle = _.first(minutes);
    day.start = this.minuteToMoment(day.startCandle.s, day.time);
    day.endCandle = _.last(minutes);
    day.end = this.minuteToMoment(day.endCandle.s, day.time);

    cb();
  }, this));

}

Manager.prototype.deleteDay = function(day, safe) {
  log.debug(
    'Found a corrupted database (',
    day.string,
    '), going to clean it up'
  );
  if(safe)
    fs.renameSync(
      day.filename,
      day.filename.replace('.db', '') + ' [incomplete ~ ' + (+moment()) + '].db'
    );
  else
    fs.unlinkSync(day.filename);

  if(day.string in this.days)
    delete this.days[day.string];
}
  
// loop through this.days and check every meta to
// see what history we have available
Manager.prototype.checkDaysMeta = function(err, results) {
  var available = {
    minutes: 0,
    first: false
  };

  // we check reversed chronologically
  // and on first gap we bail out.
  // 
  // result is stored in available
  _.every(this.history.days, function(mom) {

    var day = this.days[mom.dayString];

    var isFirstDay = equals(this.current.day, day.time);

    if(!day.exists)
      return false;
    if(day.empty)
      return this.deleteDay(day);
    if(!day.minutes)
      return false;

    if(!isFirstDay && day.endCandle.s !== MINUTES_IN_DAY)
      // this day doesn't end at midnight
      return false;

    // we have content
    available.minutes += day.minutes;
    available.first = this.mom(day.start);

    if(isFirstDay)
      available.last = this.mom(day.end);

    // if current day it needs to go back to
    // midnight if we want to consider next day
    if(isFirstDay && day.startCandle.s !== 0)
      return false;

    // if not current day, it needs to be full
    if(!isFirstDay && !day.full)
      return false;

    // this day is approved, up to next day
    return true;

  }, this);

  this.history.available = available;
}



// We know the required history and we know the available
// history. 
// 
// If we have full required history: 
//   - broadcast `history state` / full
// If we have partly/no required history: 
//   - shift requirements into future
//     as far as we have to to sync with
//     available (NOTE: this breaks compat 
//     with exchanges that  support historical
//     data).
//   - broadcast `history state` / building
Manager.prototype.processHistoryStats = function() {
  if(!this.history.required) {
    this.state = 'full history';
    return this.emit('history state', {state: 'not required'});
  }

  var history = this.history;

  // how many more minutes do we need?
  history.toFetch = history.timespan - history.available.minutes;

  if(!history.toFetch < 1) {
    // we have appear to have full history
    // though we need to verify on fetch
    // that we don't have a gap

    this.state = 'building history';
    this.emit('history state', {state: 'full'});
    return;
  }

  var done = this.startTime.clone().add('m', history.toFetch).endOf('minute');

  var state = {
    state: 'building',
    missing: history.toFetch,
    completeAt: done
  };

  if(!history.available.minutes)
    state.empty = true;

  this.history.missing = history.toFetch;

  state = _.extend(state, history.available);
  this.emit('history state', state);
}


Manager.prototype.setFetchMeta = function(data) {
  this.fetch = {
    start: this.mom(data.start),
    end: this.mom(data.end),
    next: this.mom(utc().add('ms', data.nextIn))
  };
}


// we need to verify after the first fetch
// that the history in the fetch can be stitched
// to existing historical data (ungapped).
Manager.prototype.checkHistoryAge = function(data) {
  var history = this.history;

  if(!history.available.minutes) {
    // if we don't have history, just set to fetch data
    // or the start of current day
    this.minumum = _.max([
      this.fetch.start.m.clone().subtract('s', 1),
      this.current.day.clone()
    ]);
    
    return;
  }

  if(history.available.last.minute === MINUTES_IN_DAY)
    this.increaseDay();

  this.minumum = history.available.last.m.clone().add('m', 1);

  if(this.minumum > this.fetch.start.m)
    // we're all good, process normally
    return;

  // there is a gap, mark current day as corrupted and process
  log.warn('The history we found is to old, we have to build a new one');

  this.deleteDay(this.days[this.current.dayString], true);

  // reset available history
  history.available.gap = true;
  history.available.minutes = 0
  history.available.first = false;
  history.toFetch = history.timespan;
}


// Calculate when we have enough historical data
// to provide normal advice
Manager.prototype.calculateAdviceTime = function(next, args) {
  if(this.state !== 'building history')
    // we are not building history, either
    // we don't need to or we're already done
    return next(args);

  var history = this.history;
  var toFetch = history.toFetch;

  if(toFetch < 0)
    // we have full history
    return this.broadcastHistory(next, args);

  // we have partly history
  log.debug(
    'We don\'t have enough history yet, expecting to be done at',
    this.startTime.clone().add('m', toFetch + 1).startOf('minute').format('YYYY-MM-DD HH:mm:ss'),
    'UTC'
  );

  next(args);
}

// broadcast full history
Manager.prototype.broadcastHistory = function(next, args) {
  var history = this.history;

  if(history.available.last)
    // first run
    var last = this.mom(history.available.last.m);
  else {
    // after filling full history while fetching live
    var m = this.minuteToMoment(this.mostRecentCandle.s, this.current.day)
    var last = this.mom(m);
  }

  var first = this.mom(last.m.clone().subtract('m', history.timespan));

  log.debug('going to broadcast history');
  this.state = 'full history';

  // get the required days in an array of moms
  var days = this.requiredDays(history.timespan, last.m).reverse();

  // get the candles for each required day
  var iterator = function(mom, next) {
    var from = 0;
    var to = MINUTES_IN_DAY;

    if(equals(mom.day, last.day))
      // on first (most recent) day 
      to = last.minute;

    if(equals(mom.day, first.day))
      // on last (oldest) day
      from = first.minute;

    this.getCandles(mom, from, to, next);
  }

  // emit all candles together
  var emit = function(err, batches) {
    if(err || !batches)
      throw err;

    // transport
    batches = _.map(batches, function(batch, i) {
      var day = days[i];
      return this.transportCandles(batch, day);
    }, this);

    // flatten
    var candles = _.flatten(batches);

    this.emit('history', {
      meta: {
        first: first,
        last: last
      },
      candles: candles
    });

    next(args);
  }

  async.map(
    days,
    _.bind(iterator, this),
    _.bind(emit, this)
  );
}

// grab candles in a specific day
// 
// mom = day representation of day to fetch from
// from = start candle in minutes
// to = end candle in minutes
// cb = callback
Manager.prototype.getCandles = function(mom, from, to, cb) {
  this.loadDatabase(mom);

  this.days[mom.dayString].handle.find({
    s: {
      $lte: to,
      $gte: from  
    }
  }, cb);
}

// grab a batch of trades and for each full minute
// create a new candle
Manager.prototype.processTrades = function(data) {

  this.setFetchMeta(data);

  if(this.fetch.start.day > this.current.day)
    util.die('FATAL: Fetch data appears from the future, don\'t know how to process');

  // if first run
  if(!this.minumum) {
    // first calculate some stuff
    this.checkHistoryAge(data);

    // this function will rerun process
    // trades when done.
    this.calculateAdviceTime(this.processTrades, data);
    return;
  }
  var trades = this.filterTrades(data.all);

  if(!_.size(trades)) {
    log.debug('done with this batch (1)');
    return this.emit('processed');
  }

  log.debug('processing', _.size(trades), 'trade(s)');
  log.debug(
    'from',
    moment.unix(_.first(trades).date).utc().format(),
    'to',
    moment.unix(_.last(trades).date).utc().format()
  );

  var candles = this.calculateCandles(trades);

  if(this.fetchHasNewDay()) {
    // multple days
    var batches = this.splitCandleDays(candles);

    if(_.size(batches) > 2)
      util.error('More than 2 days of new data per fetch not supported');

    // we are dealing with two days
    log.debug('fetch spans midnight');

    // old day
    batches[0] = this.addEmtpyCandles(_.first(batches), this.mostRecentCandle, MINUTES_IN_DAY);

    // new day

    // we have to create a fake candle so we can fill gap
    // after midnight with empty candles reflecting last price
    var ghostCandle = _.clone(_.last(batches[0]));
    ghostCandle.s = -1;
    batches[1] = this.addEmtpyCandles(_.last(batches), ghostCandle);

    this.leftovers = batches[1].pop();

    this.processMidnight = true;

  } else {

    // we already know they are all from current day

    // but if the most recent candle is from yesterday ...
    if(this.mostRecentCandle && this.mostRecentCandle.s === MINUTES_IN_DAY) {
      var ghostCandle = _.clone(this.mostRecentCandle);
      ghostCandle.s = -1;
      var batch = this.addEmtpyCandles(candles, ghostCandle);
    } else
      var batch = this.addEmtpyCandles(candles, this.mostRecentCandle);

    this.leftovers = batch.pop();

    var batches = [ batch ];
  };

  // set threshold for next fetch
  this.minumum = this.fetch.end.m.clone();

  // if we only have leftovers we can skip insert clause
  if(_.size(batches) === 1 && _.size(_.first(batches)) === 0)
    return this.finishInsert();

  // now we have candles in batches per day, insert and process result
  async.eachSeries(batches, this.insertCandles, this.finishInsert);
}


// filter out all trades that are do not belong to the last candle
Manager.prototype.filterTrades = function(trades) {
  log.debug('minimum trade treshold:', this.minumum.utc().format('YYYY-MM-DD HH:mm:ss'), 'UTC');

  return trades = _.filter(trades, function(trade) {
    return this.minumum < moment.unix(trade.date).utc();
  }, this);
}

// turn a batch of trades into 1m candles. Is sorted as
// long as the batch of trades are.
Manager.prototype.calculateCandles = function(trades) {
  var candles = [];
  var minutes = [];

  // if we have remaining trades from last fetch
  // let's include them to this round
  if(this.leftovers) {
    var m = this.leftovers;
    candles.push(m);

    // fix vwp pre state after
    // finalizing it to early
    m.p *= m.v;
    minutes.push(m.s);
  }

  var f = parseFloat;

  _.each(trades, function(trade) {
    var mom = moment.unix(trade.date).utc();
    var min = this.momentToMinute(mom);

    var price = f(trade.price);
    var amount = f(trade.amount);
    if(!_.contains(minutes, min)) {
      // create a new candle
      // for this minute
      candles.push({
        s: min,           // # minutes since midnight UTC
        o: price,         // open price
        h: price,         // high price
        l: price,         // low price
        c: price,         // close price
        v: amount,        // volume in asset
        p: price * amount // volume weighted price
      });
      minutes.push(min);
    } else {
      // update h, l, c, v, p
      var m = _.last(candles);
      m.h = _.max([m.h, price]);
      m.l = _.min([m.l, price]);
      m.c = price;
      m.v += amount;
      m.p += price * amount;
    }
  }, this);

  // we have added up all prices (relative to volume)
  // now divide by volume to get the Volume Weighted Price
  candles = _.map(candles, function(c) {
    c.p /= c.v;
    return c;
  });

  return candles;
}

// split a batch of candles into seperate arrays per day
Manager.prototype.splitCandleDays = function(candles) {
  var batches = [[]];
  var last = 0;

  _.each(candles, function(c) {
    if(c.s < last)
      batches.push([]);

    last = c.s;

    _.last(batches).push(c);
  }, this);

  return batches;
}




// We store each minute, even minutes that didn't contain
// any trades.
//
// `candles` is an array with candles that did contain trades
//
// (optional) `start` indicates from where up to the first candle we should
// add empty candles. Start is a candle
//
// (optional) `end` indicates from the last candle up to where we should
// add empty candles. End is a minute # since midnight.
//
// for example:
//    addEmtpyCandles(candles, 0, MINUTES_IN_DAY)
// would return an array of candles from:
//     [midnight up to][batch without gaps][up to next midnight - 1]
Manager.prototype.addEmtpyCandles = function(candles, start, end) {
  var length = _.size(candles);
  if(!length)
    return candles;

  if(start) {
    // put the start candle in front
    candles.splice(0, 0, start);
    length = _.size(candles);
  }

  var last = length - 1;
  var emptyCandles = [];

  // for each candle iterate and if the next one does
  // not exist, create it
  _.each(candles, function(c, i) {
    // if this was last and we don't
    // have to fill a gap after this batch
    // we're done
    if(i === last && !end)
      return;

    var min = c.s + 1;

    if(i === last && end)
      var max = end + 1;
    else
      var max = candles[i + 1].s;

    var empty, prevClose;

    if(min > max) {
      console.log('c', candles, 's', start, 'e', end);
      throw 'Weird error 2';
    }

    while(min !== max) {
      empty = _.clone(c);
      empty.s = min;
      empty.v = 0;

      var prevClose = empty.c;
      // set o, h, l, p to previous
      // close price
      empty.o = prevClose;
      empty.h = prevClose;
      empty.l = prevClose;
      empty.p = prevClose;

      emptyCandles.push(empty);
      min++;
    }
  });

  // we added start to fill the gap from before
  // previous candles to this batch
  if(start)
    candles.shift();

  var all = candles.concat(emptyCandles);
  
  return this.sortCandles(all);
}


// store a batch of candles under the day specified by
// `this.current`. If cb is specified runs this after 
// inserting all candles (inserts 1 per tick).
Manager.prototype.insertCandles = function(candles, cb) {
  if(!_.size(candles))
    return cb();

  // because this function is async make
  // sure we are using the right day.
  var day = _.clone(this.current);

  // make sure the database is loaded
  this.createDatabase(day);

  // broadcast each fake candle, one per tick
  // they should be dealt with during this tick
  // because a new one may come on the next..
  var iterator = function(c, next) {
    // async func wrapper to not pass error
    // and halt the async chain
    var _next = function() { next() };

    this.defer(function() {
      log.debug(
        'inserting candle',
        c.s,
        '(' + day.dayString,
        this.minuteToMoment(c.s, day.day).format('HH:mm:ss') + ' UTC)',
        'volume:',
        c.v
      );

      var candle = this.transportCandle(c, day);
      this.emit('candle', candle);

      if(this.state === 'building history') {
        this.history.toFetch--;

        if(!this.history.toFetch) {
          // we are done fetching
          
          // todo: broadcast history
          return this.broadcastHistory(_next);
        }
      }

      next();
    });
  }

  var done = function() {
    if(this.processMidnight)
      this.increaseDay();

    this.processMidnight = false;
    cb();
  }

  this.mostRecentCandle = _.last(candles);

  // first persist to disk, than broadcast
  this.days[day.dayString].handle.insert(candles, _.bind(function(err) {
    if(err) {
      log.warn(
        'DOUBLE UNIQUE INSERT, this should never happen. Please post details ',
        'here: https://github.com/askmike/gekko/issues/90',
        day.dayString,
        err.key,
        err
      );
      throw err;
    }

    async.eachSeries(
      candles,
      _.bind(iterator, this),
      _.bind(done, this)
    );

  }, this));
}

// unmount a day from memory and mark the cache
// ready for GC
Manager.prototype.unloadDay = function(dayString) {
  if(!this.days[dayString])
    return;

  this.days[dayString].mounted = false;
  this.days[dayString].handle = false;
}

Manager.prototype.increaseDay = function() {
  log.debug('shifting past midnight');

  // unload old day
  this.unloadDay(this.current.dayString);

  this.setDay(this.current.day.clone().add('d', 1));
}

Manager.prototype.finishInsert = function(err, results) {
  this.emit('processed');
}

// // HELPERS
Manager.prototype.setDay = function(m) {
  this.current = this.mom(m.clone());
}

// how many days are in this trade batch?
Manager.prototype.fetchHasNewDay = function() {
  return !equals(this.fetch.end.day, this.current.day);
}

Manager.prototype.sortCandles = function(candles) {
 return candles.sort(function(a, b) {
   return a.s - b.s;
  });
}

Manager.prototype.minuteToMoment = function(minutes, day) {
  if(!day)
    day = this.current.day;
  day = day.clone().startOf('day');
  return day.clone().add('minutes', minutes);
};

Manager.prototype.momentToMinute = function(moment) {
  var start = moment.clone().startOf('day');
  return Math.floor(moment.diff(start) / 1000 / 60);
};

// Internal data structure for easy dealing
// with dates.
Manager.prototype.mom = function(m) {
  return {
    m: m,
    minute: this.momentToMinute(m),
    day: m.clone().startOf('day'),
    dayString: m.format('YYYY-MM-DD')
  }
}

Manager.prototype.databaseName = function(mom) {
  if(!('dayString' in mom))
    mom = this.mom(mom);

  return this.historyPath + [
    config.watch.exchange,
    config.watch.currency,
    config.watch.asset,
    mom.dayString + '.db'
  ].join('-');
}

// small wrapper around a fake candle
// to make it easier to throw them around
Manager.prototype.transportCandle = function(c, day) {
  // check whether we got a mom or a moment
  if(!day.m)
    day = this.mom(day.clone());

  delete c._id;

  return {
    candle: c,
    time: day.m.clone().add('m', c.s),
    day: day
  }
}
Manager.prototype.transportCandles = function(candles, day) {
  return _.map(candles, function(c) {
    return this.transportCandle(c, day);
  }, this);
}

// executes cb on next tick while
// maintaining context (to `Manager`).
Manager.prototype.defer = function(cb) {
  return _.defer(_.bind(cb, this));
}

module.exports = Manager;
