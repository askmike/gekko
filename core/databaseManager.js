
// This serves as an abstraction layer for Gekko:
// we store all candles as 1m candles in a
// database per day. Using this method you can
//
// - Store new candles in the database based
//   on fetched trade data.
// - Get candles out of a database.
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
//  - The 1m candles are an internal datastructure
//    (referred to as fake candles), when clients
//    request candle data we convert the 1m
//    candles on the fly to the desired X minute
//    based candles (referred to as real candles).
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

var equals = util.equals;

// even though we have leap seconds, every
// day has the same amount of minutes
var MINUTES_IN_DAY = 1439;

var Manager = function() {
  _.bindAll(this);

  // all minutes we fetched that are part
  // of the real candle
  this.realCandleContents = [];

  this.historyPath = config.history.directory || './history/';
  this.days = {};
  this.realCandleSize = false;

  this.currentDay;

  this.state = 'building history';
  // 'realtime updating'

  // make sure the historical folder exists
  if(!fs.existsSync(this.historyPath))
    fs.mkdirSync(this.historyPath);

  if(!fs.existsSync(this.historyPath))
    throw 'Gekko is unable to save historical data, do I have sufficient rights?';

  this
    .on('processed', function() {
      this.defer(function() {
        log.info(
          'Processed trades, sleeping for',
          this.fetch.next.m.fromNow(true),
          '...'
        );
      });
    })
    .on('full history build', this.emitRealtime)
};

var Util = require('util');
var EventEmitter = require('events').EventEmitter;
Util.inherits(Manager, EventEmitter);

// load all databases we need based on fetch
// data (which tells us how for we can currently
// fetch back and thus what our limits are)
Manager.prototype.init = function(data) {
  this.setFetchMeta(data);

  // what do we need if we want to start right 
  // away? 
  this.required = {
    to: this.mom(utc().subtract('ms', data.timespan)),

    // todo: abstract EMA stuff out of this
    from: this.mom(util.intervalsAgo(config.EMA.candles).utc())
  }

  // the order in which we do things:
  // - (receive first batch)
  // - check historical db
  // - process new trades

  this.once('history', function() {
    this.processTrades(data);
  });

  this.setDay(this.fetch.start.m);
  this.loadDays();
}

// emit all events required for realtime
// candle propogation
Manager.prototype.emitRealtime = function() {
  this
    .on('fake candle', this.watchRealCandles);
    // .on('real candle', function(candle) {
    //   log.debug(
    //     'NEW REAL CANDLE'//,
    //     // [
    //     //   '',
    //     //   'TIME:\t' + candle.start.format('YYYY-MM-DD HH:mm:ss'),
    //     //   'O:\t' + candle.o,
    //     //   'H:\t' + candle.h,
    //     //   'L:\t' + candle.l,
    //     //   'C:\t' + candle.c,
    //     //   'V:\t' + candle.v,
    //     //   'VWAP:\t' + candle.p
    //     // ].join('\n\t')
    //   );
    // });
}

Manager.prototype.setFetchMeta = function(data) {
  this.fetch = {
    start: this.mom(data.start),
    end: this.mom(data.end),
    next: this.mom(utc().add('ms', data.nextIn))
  };
}

Manager.prototype.setRealCandleSize = function(interval) {
  this.realCandleSize = interval;
}

// fires everytime we have a new 1m candle
// and aggregates them into the candles
// of the required size
Manager.prototype.watchRealCandles = function() {
  if(_.size(this.realCandleContents) < this.realCandleSize)
    return;

  var candle = this.calculateRealCandle(this.realCandleContents);

  this.emit('real candle', candle);

  this.realCandleContents = [];
}

// retrieve an 1m candle out of the DB
Manager.prototype.getCandle = function(mom, callback) {
  this.days[mom.dayString].handle.findOne({s: mom.minute}, callback);
}

Manager.prototype.setDay = function(m) {
  this.current = this.mom(m.clone());
}

Manager.prototype.today = function() {
  return utc().startOf('day');
}

// grab a batch of trades and for each full minute
// create a new candle
Manager.prototype.processTrades = function(data) {

  this.setFetchMeta(data);
  // first time make sure we have
  // loaded this day.
  if(!this.leftovers)
    this.loadDay(this.current.day);

  // if first time
  if(!this.minumum) {
    // if we have history
    if(this.history.newest) {
      this.minumum = this.history.newest.m.clone().add('m', 1);

      // mega edge case: we got the full day in history up to 
      // the last minute, this means that next minute starts at
      // next day.
      if(this.history.newest.minute === MINUTES_IN_DAY) {
        this.setDay(this.minumum);
        this.loadDay(this.current.m);
        this.insertSinceMidnight = true;
      }

      // the previous candle
      var day = this.days[this.current.dayString];
      this.mostRecentCandle = day.endCandle;
    } else {

      // store everything we might need 
      // without yesterday going to yesterday
      // (because if that day already exists we
      // are overwriting those candles).
      this.minumum = _.max([
        this.required.from.day.clone(),
        this.fetch.end.day.clone()
      ]);
      // we don't have any candle yet
      this.mostRecentCandle = false;
    }
  }

  log.debug('minimum trade treshold:', this.minumum.utc().format('YYYY-MM-DD HH:mm:ss'), 'UTC');

  // filter out all trades that are do not belong to the last candle
  var trades = _.filter(data.all, function(trade) {
    return this.minumum < moment.unix(trade.date).utc();
  }, this);

  if(!_.size(trades)) {
    this.emit('processed');
    return log.debug('done with this batch (1)');
  }

  log.debug('processing', _.size(trades), 'trade(s)');

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

  // bucket all trades into minutes
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

  // bail out if we don't have any new stuff
  var amount = _.size(candles);
  if(amount === 0) {
    // this shouldn't happen as we
    // can't have 0 candles out of
    // N trades.
    this.emit('processed');
    return log.debug('done with this batch (2)');
  } else if(amount === 1) {
    // update leftovers with new trades
    this.leftovers = _.first(candles);
    this.minumum = moment.unix(_.last(trades).date).utc();
    this.emit('processed');
    return log.debug('done with this batch (3)');
  }

  var lastTrade = _.last(trades);
  var last = moment.unix(lastTrade.date).utc();
  var firstTrade = _.first(trades);
  var first = moment.unix(firstTrade.date).utc();

  // we need to verify that all candles belong to today
  // else:
  // - first insert the candles from today and fill upto midnight
  // - shift to new day
  // - insert remaining candles with filling from last midnight
  if(!equals(last.clone().startOf('day'), this.current.day)) {
    log.debug('This batch includes trades for a new day.');
    // some trades are after midnight, create
    // a batch for today and for tomorrow,
    // insert today, shift a day, insert tomorrow
    var firstBatch = [], secondBatch = [];

    _.each(trades, function(t) {
      var date = moment.unix(t.date).utc();
      var day = date.clone().startOf('day');
      var minute = this.momentToMinute(date);

      // add all the candles belonging
      // to trades to the right batch
      if(equals(day, this.current.day))
        var batch = firstBatch;
      else
        var batch = secondBatch;

      batch.push(_.find(candles, function(c) {
        return c.s === minute;
      }));
    }, this);

    this.firstBatch = true;

    // for every trade in a candle we've
    // added the candle, strip out all
    // candles except one candle per
    // minute
    firstBatch = _.compact(_.uniq(firstBatch));
    secondBatch = _.compact(_.uniq(secondBatch));

    var startFrom = this.mostRecentCandle;

    // add candles:
    //       [gap between this batch & last inserted candle][batch][midnight]
    firstBatch = this.addEmtpyCandles(firstBatch, startFrom, MINUTES_IN_DAY);
    this.storeCandles(firstBatch);

    this.firstBatch = false;

    this.setDay(last.clone());
    this.loadDay(this.current.day);

    // add candles:
    //       [midnight][batch]
    var ghostCandle = _.clone(_.last(firstBatch) || this.mostRecentCandle);
    ghostCandle.s = -1;
    secondBatch = this.addEmtpyCandles(secondBatch, ghostCandle);
    this.leftovers = secondBatch.pop();

    this.storeCandles(secondBatch);

  } else {

    // part of mega edgecase: we need to insert empty candles
    // from midnight to batch. To do this we need the price of
    // yesterday's last candle.
    if(this.insertSinceMidnight) {
      this.insertSinceMidnight = false;
      // add candles:
      //       [midnight][gap between this batch & last inserted candle][batch]
      var yesterday = this.mom(this.current.m.clone().subtract('d', 1));
      var ghostCandle = _.clone(this.days[yesterday.dayString].endCandle);
      ghostCandle.s = -1;
      candles = this.addEmtpyCandles(candles, ghostCandle);
    } else {

      var startFrom = this.mostRecentCandle;
      if(startFrom.s > _.first(candles).s) {
        throw 'Weird error';
      }

      // add candles:
      //       [gap between this batch & last inserted candle][batch]
      candles = this.addEmtpyCandles(candles, startFrom);
    }
    this.leftovers = candles.pop();
    this.storeCandles(candles);
  }

  if(lastTrade)
    this.minumum = last;
  else
    console.log('why is this called without trades?');
}

Manager.prototype.storeCandles = function(candles) {
  if(!_.size(candles))
    return;

  // because this function is async make
  // sure we are using the right day.
  var day = _.clone(this.current);

  // broadcast each fake candle one per tick
  // they need to be dealt with during this tick
  // else the state will already be updated
  var iterator = function(c, next) {
    this.defer(function() {
      log.debug(
        'inserting candle',
        c.s,
        '(' + day.dayString,
        this.minuteToMoment(c.s, day.day).format('HH:mm:ss') + ' UTC)',
        'volume:',
        c.v
      );

      var fakeCandle = this.transportCandle(c, day);
      this.realCandleContents.push(fakeCandle);
      this.emit('fake candle', fakeCandle);

      next();
    });
  }
  var done = function() {
    // this was not the only batch for this trade
    // batch, another one coming up
    if(this.firstBatch)
      return;

    if(this.leftovers)
      log.debug('Leftovers:', this.leftovers.s);

    this.emit('processed');

    // if we were waiting for full history,
    // check whether we got it
    if(this.state === 'building history') {
      var last = this.minuteToMoment(
        this.mostRecentCandle.s,
        this.current.day
      );

      if(this.required.to.m < last)
        this.recheckHistory();
    }
  }

  async.eachSeries(
    candles,
    _.bind(iterator, this),
    _.bind(done, this)
  );

  this.mostRecentCandle = _.last(candles);

  // we insert right away and emit on next ticks, so that if shit
  // hits the fan we atleast still have the data stored safely.
  this.days[day.dayString].handle.insert(candles, function(err) {
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
  });
}

// recheck if history is complete enough
Manager.prototype.recheckHistory = function() {
  var days = this.requiredDays();

  days = _.map(days, function(d) {
    return this.days[d.dayString];
  }, this);

  var iterator = function(day, next) {
    this.setDayMeta(day, _.bind(function(err) {
      if(err)
        return next(err);

      this.verifyDay(day.string, next);
    }, this))
  }

  var done = function(err) {
    if(err)
      throw 'Gekko expected the history to be complete, however it was not :(';

    this.broadcastHistory(err);
  }

  async.eachSeries(
    days,
    _.bind(iterator, this),
    _.bind(done, this)
  );
}

// We store each minute, even minutes that didn't contain
// any trades.
//
// `candles` is an array with candles that did contain trades
//
// `start` indicates from where up to the first candle we should
// add empty candles. Start is a candle
//
// `end` indicates from the last candle up to where we should
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

    if(min > max)
      throw 'Weird error...';

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

Manager.prototype.deleteDay = function(day, safe) {
  log.warn(
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

// calculate all days which we need data from
// based on:
// 
// - what are the fetch results?
// - what data do we need?
// 
// (it will calculate the widest range between
// those and return array with all those days
// chronologically reversed.)
Manager.prototype.requiredDays = function() {
  var start = _.min(
    [
      this.required.from.m,
      this.fetch.start.m
    ]
  ).clone().startOf('day');

  var end = _.max(
    [
      this.required.to.m,
      this.fetch.end.m
    ]
  ).clone().startOf('day');

  var days = [];

  while(end >= start) {
    days.push(this.mom(end.clone()));
    end.subtract('d', 1);
  };

  return days;
}


// calculate from which days databases we need data
// load & verify that data, and emit the status
Manager.prototype.loadDays = function() {
  // the history we have available
  this.history = {
    newest: false,
    oldest: false
  };

  var days = _.pluck(this.requiredDays(), 'm');

  // load & verify each day
  var iterator = function(day) {
    // we validate from now till past,
    // bail out as soon as we've hit
    // the fist gap
    return function(next) {
      this.loadDay(day, true, _.bind(function(err, day) {
        if(err || !day)
          return next(err);

        this.verifyDay(day, next);
      }, this));
    }
  }

  var checkers = _.map(days, function(day) {
    return _.bind(iterator(day), this);
  }, this);

  async.series(
    checkers,
    this.broadcastHistory
  );
};

Manager.prototype.broadcastHistory = function(err) {
  var h = this.history;

  // run this when we don't have full history yet. 
  // This will make sure that once we do, we will 
  // broadcast it.
  var bail = _.bind(function() {
    // in the future we will have the complete history
    // let's update the expectations
    var requiredHistory = util.minToMs(config.EMA.candles * config.EMA.interval);
    if(h.oldest)
      var from = h.oldest.m.clone();
    else
      var from = this.fetch.start.m.clone();
    var to = from.clone().add('ms', requiredHistory);

    this.required = {
      from: this.mom(from),
      to: this.mom(to)
    };
  }, this);

  if(err === 'history to old') {
    log.warn([
      'History is to old, if we would just start',
      'appending new data we would have a gap between',
      'the fresh data and the old data.'
    ].join(' '));
    bail();
    return this.emit('history', {complete: false, empty: true});
  };

  if(err === 'file not found') {
    if(!h.oldest) {
      // we don't have any history
      bail();
      return this.emit('history', {complete: false, empty: true});
    } else {
      bail();
      return this.emit('history', {
        start: h.oldest.m.clone(),
        end: h.newest.m.clone(),
        complete: false
      });
    }
  }

  if(err === 'history incomplete') {
    bail();
    return this.emit('history', {
      start: h.oldest.m.clone(),
      end: h.newest.m.clone(),
      complete: false
    });
  }

  if(err || !h.oldest) {
    log.debug('This should not happen, please post details here: https://github.com/askmike/gekko/issues/90')
    bail();
    return this.emit('history', {complete: false, empty: true});
  }

  // we have *ungapped* historical data
  // get it all and broadcast it
  this.defer(function() {
    this.broadcastFullHistory({
      start: h.oldest.m.clone(),
      end: h.newest.m.clone(),
      complete: true
    });
  });
}

// At this point we have full history,
// fetch everything and broadcast it
Manager.prototype.broadcastFullHistory = function(meta) {
  var days = this.requiredDays()
  var done = function(err, result) {
    // concat all days together
    result = _.flatten(result);

    // broadcast all the candles
    this.emit('history', _.extend(meta, {
      candles: result
    }));

    log.debug('Setting state to', 'realtime updating');
    this.state = 'realtime updating';
    this.emit('full history build');
  }

  var iterator = function(day, next) {
    this.getDayHistory(day, false, next);
  }

  async.map(
    days,
    _.bind(iterator, this),
    _.bind(done, this)
  )
}

Manager.prototype.calculateRealCandle = function(fakeCandles) {
  var first = fakeCandles.shift();
  var firstCandle = _.clone(first.candle);

  delete firstCandle._id;
  firstCandle.p = firstCandle.p * firstCandle.v;
  firstCandle.start = this.minuteToMoment(firstCandle.s, first.day.m);

  // create a fake candle based on all real candles
  var candle = _.reduce(
    this.realCandleContents,
    function(candle, m) {
      m = m.candle;
      candle.h = _.max([candle.h, m.h]);
      candle.l = _.min([candle.l, m.l]);
      candle.c = m.c;
      candle.v += m.v;
      candle.p += m.p * m.v;
      return candle;
    },
    firstCandle
  );

  if(candle.v)
    // we have added up all prices (relative to volume)
    // now divide by volume to get the Volume Weighted Price
    candle.p /= candle.v;
  else
    // empty candle
    candle.p = candle.o;

  return candle;
}

// transform all candles from fake to real
// all the leftovers are prepared for the new 
// real candle calculation
Manager.prototype.calculateRealCandles = function(fakeCandles) {
  var realCandles = [];
  var bucket = [];
  _.each(fakeCandles, function(c, i) {
    bucket.push(c);
    if(i !== 0 && i % this.realCandleSize === 0) {
      realCandles.push(this.calculateRealCandle(bucket));
      bucket = [];
    };
  }, this);

  // set the remaining fake candles as
  // leftovers for the new real candle
  // calculation
  this.realCandleContents = bucket;
  return realCandles;
}

Manager.prototype.getRealCandles = function(candles, day) {
  candles = this.transportCandles(candles, day);
  candles = this.calculateRealCandles(candles);
  return candles;
}

// get all the real candles of a day, full day
// if limit is false else:
//
// if limit is an object the
Manager.prototype.getDayHistory = function(day, limit, cb) {
  var dayString = day.dayString;

  if(!(dayString in this.days))
    throw dayString + ' should have been loaded but isn\'t';

  var next = function(err, candles) {
    if(err)
      return cb(err);

    cb(false, this.getRealCandles(candles, day));
  }

  this.days[dayString].handle.find({s: {$gt: -1}}, _.bind(next, this));
}

// for each day (from now to past)
//  - load it
//  - if today:
//      check if since midnight
//      check if up to now - fetchInterval
//    else if last:
//      check if first < startMinute
//    else
//      check if full
// as soon as the first one errors
// we know the history we have
Manager.prototype.verifyDay = function(day, next) {
  if(!day)
    return next(true);

  day = this.days[day];

  if(day.empty) {
    this.deleteDay(day);
    delete this.days[day];
    return next(true);
  }

  // resest this every iteration up
  // to the oldest accepted day
  this.history.oldest = this.mom(day.start);

  // the first iteration we're at
  // the most recent day
  if(!this.history.newest) {
    this.history.newest = this.mom(day.end);
    this.setDay(day.end);
  }

  // if this day is full, we're done
  // straight away
  if(day.full)
    return next(false);


  // is this the first day we need data from?
  var startDay = equals(this.required.from.day, day.time);
  // is this the last day we need data from?
  var endDay = equals(this.fetch.end.day, day.time);

  // if this is a day in the middle and
  // it's not full we don't have complete
  // history
  if(!startDay && !endDay) {
    this.deleteDay(day, true);
    return next('history incomplete');
  }

  // if this is the first day we need to have data
  // from before the required from date. Else we 
  // don't have enough.
  if(startDay && day.start > this.required.from.m)
    return next('history incomplete');

  // if this is the last (= most recent) day we
  // need to have data from after the required
  // to date. Else the history is outdated.
  if(endDay && day.end < this.required.to.m) {
    this.deleteDay(day, true);
    return next('history to old');
  }

  next(false);
}

// load a daily database
//
// note this function returns via callback
// if check is true it returns the string if
// the db existed, false otherwise
Manager.prototype.loadDay = function(mom, check, next) {
  var cb = next || function() {};
  var day = mom.clone().startOf('day');
  var string = day.format('YYYY-MM-DD');
  var file = this.historyPath + [
    config.watch.exchange,
    config.watch.currency,
    config.watch.asset,
    string + '.db'
  ].join('-');

  // if we already loaded the day, pass
  // it back straight away
  if(string in this.days) {
    return cb(false, string);
  }

  day = {
    handle: false,
    time: day,
    filename: file,
    string: string,

    // meta
    full: false,
    start: false,
    startCandle: false,
    end: false,
    endCandle: false,
    empty: true
  };

  if(!fs.existsSync(file)) {
    // if we should not create it, bail out
    if(check)
      return cb('file not found');

    log.debug('Creating a new daily database for day', string);

    day.handle = new nedb({filename: file, autoload: true});
    day.handle.ensureIndex({fieldName: 's', unique: true});

    this.days[day.string] = day;

    return cb(null, day.string);
  }
  // it exists already
  day.handle = new nedb({filename: file, autoload: true});
  day.handle.ensureIndex({fieldName: 's', unique: true});

  this.days[day.string] = day;

  // set meta
  if(!check)
    return cb(null, day.string);
  this.setDayMeta(day, cb);
}

// set the meta information of daily database.
Manager.prototype.setDayMeta = function(day, cb) {
  day.handle.find({s: {$gt: -1}}, _.bind(function(err, minutes) {
    if(err)
      throw err;

    day.minutes = _.size(minutes);
    if(day.minutes === 0) {
      day.empty = true;
      day.full = false;
      day.startCandle = false;
      day.start = false;
      day.endCandle = false;
      day.end = false;
    } else {
      day.empty = false;
      day.full = day.minutes === MINUTES_IN_DAY;
      day.startCandle = _.first(minutes);
      day.start = this.minuteToMoment(day.startCandle.s, day.time);
      day.endCandle = _.last(minutes);
      day.end = this.minuteToMoment(day.endCandle.s, day.time);
    }

    // store / overwrite a global reference
    this.days[day.string] = day;

    cb(false, day.string);
  }, this));
}

// HELPERS


Manager.prototype.sortCandles = function(candles) {
 return candles.sort(function(a, b) {
   return a.s - b.s;
  });
}

Manager.prototype.minuteToMoment = function(minutes, day) {
  if(!day)
    day = this.currentDay;
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

// small wrapper around a fake candle
// to make it easier to throw them around
Manager.prototype.transportCandle = function(c, day) {
  // check whether we got a mom or a moment
  if(!day.m)
    day = this.mom(day.clone());

  return {
    candle: c,
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

module.exports = new Manager;
