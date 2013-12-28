
// This serves as an abstraction layer for Gekko:
// we store all candles as 1m candles in a 
// database per day. Using this method you can
// 
// - Store new candles in a database
// - Getting candles out of a database
// 
// This manager will convert candles on the
// fly from 1m to whatever is needed
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
//    manager doesn't know that the data is 
//    corrupted.

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

  // internally every candle is 1m
  // but when someone requests a candle
  // we need to give back a bigger one
  this.realCandleSize = config.EMA.interval;
  // all minutes we fetched that are part
  // of the real candle
  this.realCandleContents = [];

  this.historyPath = './history/';
  this.days = {};

  this.currentDay;

  // make sure the historical folder exists
  if(!fs.existsSync(this.historyPath))
    fs.mkdirSync(this.historyPath);

  this.on('empty history', function() {
    console.log('empty history');
  });

  // this.on('candle', this.watchRealCandles);
  // this.on('real candle', function(candle) {
  //   log.debug(
  //     'NEW REAL CANDLE:',
  //     candle.s.format('YYYY-MM-DD HH:mm:ss'),
  //     ['O:', candle.o, ', H:', candle.h, ', L:', candle.l, ', C:', candle.c].join('')
  //   );
  // });
}

var Util = require('util');
var EventEmitter = require('events').EventEmitter;
Util.inherits(Manager, EventEmitter);

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

// load all databases we need based on fetch
// data (which tells us how for we can currently
// fetch back and thus what our limits are)
Manager.prototype.init = function(data) {
  // meta state on fetch data
  this.fetch = {
    start: this.mom(data.start),
    end: this.mom(data.end),
    next: this.mom(utc().add('ms', data.nextIn))
  };

  // what do we need if we want
  // to start right away?
  this.required = {
    from: this.mom(util.intervalsAgo(config.EMA.candles).utc())
  }

  this.setDay(this.fetch.start.m);
  this.loadDays();
}

// fires everytime we have a new 1m candle
// and aggregates them into the candles
// of the required size
Manager.prototype.watchRealCandles = function() {
  if(_.size(this.realCandleContents) !== this.realCandleSize)
    return;

  var first = this.realCandleContents.shift();

  delete first.candle._id;
  first.candle.s = this.minuteToMoment(first.candle.s, first.day);

  // create a fake candle based on all real candles
  var candle = _.reduce(
    this.realCandleContents,
    function(candle, m) {
      m = m.candle;
      candle.h = _.max([candle.h, m.h]);
      candle.l = _.min([candle.l, m.l]);
      candle.c = m.c;
      candle.v += m.v
      return candle;
    },
    first.candle
  );

  this.emit('real candle', candle);

  this.realCandleContents = [];
}

// retrieve an 1m candle out of the DB
Manager.prototype.getCandle = function(minute, day, callback) {
  if(!day)
    day = this.currentDayString;

  this.days[day].handle.find({s: minute}, callback);
}

Manager.prototype.setDay = function(m) {
  this.current = this.mom(m);
}

Manager.prototype.today = function() {
  return utc().startOf('day');
}

// grab a batch of trades and for each full minute
// create a new candle
Manager.prototype.processTrades = function(data) {
  // TODO:
  // we can only do this once we know
  // how what our history looks like
  // 
  // hotfix for race condition, need 
  // better solution
  if(!this.historySet) {
    return this.onHistorySet = function() {
      this.processTrades(data)
    };
    // race condition fix
  } else if(!this.leftovers)
    this.loadDay(this.current.day);

  console.log('TRADES', data.all.length);
  console.log('TRADES', moment.unix(_.first(data.all).date).utc().format('HH:mm:ss'));
  console.log('TRADES', moment.unix(_.last(data.all).date).utc().format('HH:mm:ss'));

  // if first time
  if(!this.minumum) {
    // if we have history
    if(this.history.newest) {
      // start at beginning of next candle
      this.minumum = this.history.newest.m.clone().add('m', 1);
      // the previous candle
      var day = this.days[this.current.dayString];
      this.mostRecentCandle = day.endCandle;
    } else {
      // store everything we might need
      this.minumum = this.required.from.day.clone();
      // we don't have any candle yet
      this.mostRecentCandle = false;
    }
  }
    
  // this.minumum = utc().subtract('h', 2);
  // this.mostRecentCandle = {s: this.momentToMinute(utc().subtract('h', 3))};

  console.log('MINIMUM:', this.minumum.utc().format('YYYY-MM-DD HH:mm:ss'));
  // console.log('MOST RECENT:', this.mostRecentCandle);
  // throw 'a';

  // filter out all trades that are do not belong to the last candle
  var trades = _.filter(data.all, function(trade) {
    return this.minumum < moment.unix(trade.date).utc();
  }, this);

  
  // console.log(trades);
  

  console.log('FILTERED TRADES', trades.length);
  _.each(trades, function(t) {
    console.log(
      'FILTERED TRADES',
      moment.unix(t.date).utc().format('YYYY-MM-DD HH:mm:ss'),
      'price:',
      t.price
    );
  });

  var candles = [];
  var minutes = [];

  // if we have remaining trades from last fetch
  // let's include them to this round
  if(this.leftovers) {
    var m = this.leftovers;
    candles.push(m);
    minutes.push(m.s);
  }

  console.log('starting process with these leftovers:');
  console.log(candles);

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

  var amount = _.size(candles);
  if(amount === 0)
    return log.debug('done with this batch (1)');
  else if(amount === 1) {
    if(_.size(trades)) {
      // update leftovers with new trades
      this.leftovers = _.first(candles);
      this.minumum = moment.unix(_.last(trades).date).utc();
    }

    return log.debug('done with this batch (2)');
  }


  // we need to verify that all candles belong to today
  // else:
  // - first insert the candles from today
  // - shift to new day
  // - insert remaining candles
  var last = _.last(trades).date;
  last = moment.unix(last).utc();

  // TODO: test at midnight
  if(!equals(last.startOf('day'), this.current.day)) {
    log.debug('This batch includes trades for a new day.');
    // some trades are after midnight, create
    // a batch for today and for tomorrow,
    // insert today, shift a day, insert tomorrow
    var firstBatch = [], secondBatch = [];

    // last is always after midnight
    var last = _.last(trades).date;

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

    this.setDay(moment.unix(last).utc());
    this.loadDay(this.current.day);

    // add candles:
    //       [midnight][batch]
    secondBatch = this.addEmtpyCandles(secondBatch, -1);
    this.leftovers = secondBatch.pop();

    this.storeCandles(secondBatch);

  } else {
    var startFrom = this.mostRecentCandle;
    // add candles:
    //       [gap between this batch & last inserted candle][batch]
    candles = this.addEmtpyCandles(candles, startFrom);
    this.leftovers = candles.pop();
    this.storeCandles(candles);
  }

  if(this.leftovers)
    log.debug('Leftovers:', this.leftovers.s);

  var last = _.last(trades);
  if(last)
    this.minumum = moment.unix(last.date).utc();
  else
    console.log('why is this called without trades?');
}

Manager.prototype.storeCandles = function(candles) {
  if(!_.size(candles))
    return;

  _.each(candles, function(c) {
    log.debug(
      'inserting candle',
      c.s,
      '(' + this.minuteToMoment(c.s, this.current.day).format('HH:mm:ss') + ' UTC)',
      'vol:',
      c.v
    );

    // local reference
    this.realCandleContents.push({
      candle: c,
      day: this.current.day
    });

    this.emit('candle');

  }, this);

  // console.log('SETTING mostRecentCandle', _.last(candles));
  this.mostRecentCandle = _.last(candles);

  this.days[this.current.dayString].handle.insert(candles, function(err) {
    if(err)
      log.warn('DOUBLE UNIQUE INSERT')
  });
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
      var max = mom.minutes + 1;
    else
      var max = candles[i + 1].s;

    var empty, prevClose;

    // console.log(min, max);

    // var a = 0;

    while(min !== max) {
      // a++;
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

    // console.log('res', min, a);
  });

  // we added start to fill the gap from before
  // previous candles to this batch
  if(start)
    candles.shift();

  // console.log('EXISTING CANDLES:', _.map(candles, function(c) { return c.s }));
  // console.log('ADDED EMPTY CANDLES:', _.map(emptyCandles, function(c) { return c.s }));
  // console.log('ADDED EMPTY', emptyCandles);

  var all = candles.concat(emptyCandles);
  all = all.sort(function(a, b) {
    return a.s - b.s;
  });

  // console.log(_.map(all, function(c) {return c.s}));
  // console.log(_.pluck(all, 's'));
  // throw 'a';
  // console.log('candles', candles.length);
  // console.log('emptyCandles', emptyCandles.length);
  // console.log('all', all.length);
  // console.log('from', _.first(all).s);
  // console.log('from', _.last(all).s);
  // throw 'a';

  return all;
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
      day.filename + ' [incomplete ~ ' + (+moment()) + ']'
    );
  else
    fs.unlinkSync(day.filename);
}


// calculate from which days databases we need data
Manager.prototype.loadDays = function() {
  // the history we have available
  this.history = {
    newest: false,
    oldest: false
  };

  var day = this.today();

  // create an array of days which we should
  // check to see if we have them
  var days = [];
  while(day >= this.required.from.day) {
    days.push(day.clone());
    day.subtract('d', 1);
  };

  // var foundGap = false;

  // load & verify each day
  var iterator = function(day) {

    // we validate from now till past,
    // bail out as soon as we've hit
    // the fist gap
    return function(next) {
      this.loadDay(day, true, _.bind(function(err, day) {
        if(err)
          return next(true);

        this.verifyDay(day, next);
      }, this));
    }
  }

  // we're done, interpetet results
  var checked = function(err) {
    this.setHistoryAge();
    if(!this.oldestDay) {
      this.emit('history', false); 
    } else {
      var h = this.history;
      // we have *ungapped* historical data
      this.emit('history', {
        start: h.oldest.m.clone(),
        end: h.newest.m.clone()
      });
    }
  }

  var checkers = _.map(days, function(day) {
    return _.bind(iterator(day), this);
  }, this);

  // console.log(checkers)

  // console.log(days);
  // throw 'a';
  async.series(
    checkers,
    _.bind(checked, this)
  );

  // async.some(
  //   days,
  //   _.bind(iterator, this), 
  //   _.bind(checked, this)
  // );
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
// we now the history we have
Manager.prototype.verifyDay = function(day, next) {
  if(!day)
    return next(false);

  day = this.days[day];

  if(day.empty) {
    this.deleteDay(day);
    delete this.days[day];
    return next(false);
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

  // if this day doesn't end at midnight
  // we can't use any data it has
  // 
  // except when it's about today
  // TODO: *except when it's about the first day
  // we need data from
  if(
    day.end !== MINUTES_IN_DAY &&
    !equals(this.current.day, day.time)
  )
    return next(false);

  // we can use atleast some of it's data
  this.oldestDay = day.time;
  this.oldestMinute = day.start;

  // but we can't use anything else
  // since it doesn't go back to midnight
  if(day.start !== 0)
    return next(false);

  next(true);
}

Manager.prototype.setHistoryAge = function() {
  // we can only do certain things once this is
  // set, if we have something waiting do it now
  this.historySet = true;
  if(this.onHistorySet) {
    this.onHistorySet();
    this.onHistorySet = false;
  }
}

// setup an interval to create new daily db 
// files every day at 11PM UTC.
// Manager.prototype.createDays = function() {
//   var midnight = utc()
//     .endOf('day')
//     .subtract('h', 1);

//   var untilMidnight = midnight.diff(utc());

//   setTimeout(_.bind(function() {
//     this.createDay();
//     setInterval(this.createDay, +moment.duration(1, 'days'));
//   }, this), untilMidnight);
// }

// load a daily database
// 
// note this function returns via callback
// if check is true it returns the string if
// the db existed, false otherwise
Manager.prototype.loadDay = function(mom, check, next) {
  var cb = next || function() {};

  var day = mom.clone();
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
      return cb(true);

    log.debug('Creating a new daily database for day', string);

    day.handle = new nedb({filename: file, autoload: true});
    day.handle.ensureIndex({fieldName: 's', unique: true});

    this.days[day.string] = day;

    return cb(null, day.string);
  }

  day.handle = new nedb({filename: file, autoload: true});
  day.handle.ensureIndex({fieldName: 's', unique: true});

  this.days[day.string] = day;

  // set meta
  if(!check)
    return cb(null, day.string);

  day.handle.find({}, _.bind(function(err, minutes) {
    if(err)
      throw err;

    day.minutes = _.size(minutes);
    if(day.minutes === 0) {
      day.empty = true;
    } else {
      day.empty = false;
      day.full = day.minutes === MINUTES_IN_DAY;
      day.startCandle = _.min(minutes, function(m) { return m.s; } );
      day.start = this.minuteToMoment(day.startCandle.s, day.time);
      day.endCandle = _.max(minutes, function(m) { return m.s; } );
      day.end = this.minuteToMoment(day.endCandle.s, day.time);
    }

    // store a global reference
    this.days[day.string] = day;

    cb(false, day.string);
  }, this));
}

// create a new daily database
// Manager.prototype.createDay = function(mom) {
//   if(!mom)
//     mom = this.currentDay;

//   var day = mom.clone().startOf('day');
//   var string = day.format('YYYY-MM-DD');

//   if(string in this.days)
//     return;
  
//   log.debug('Creating a new daily database for day', string);

//   var file = this.historyPath + [
//     config.watch.exchange,
//     config.watch.currency,
//     config.watch.asset,
//     string + '.db'
//   ].join('-');

//   var db = new nedb({filename: file, autoload: true});
//   db.ensureIndex({fieldName: 's', unique: true});

//   this.days[string] = {
//     string: string,
//     handle: db
//   };
// }

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

module.exports = new Manager;