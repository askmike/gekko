
// This serves as an abstraction layer for Gekko:
// we store all candles as 1m candles in a 
// database per day. Using this method you can
// 
// - Storing new candles in a database
// - Getting candles out of a database
// 
// This manager will convert candles on the
// fly from 1m to whatever is needed

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

// even though we have leap seconds
// (https://en.wikipedia.org/wiki/Leap_second)
// every day has the same amount of minutes
var MINUTES_IN_DAY = 1439;

var Manager = function() {
  _.bindAll(this);

  this.historyPath = './history/';
  this.days = {};
  this.today;
  this.startDay;

  this.on('empty history', function() {
    console.log('empty history');
  });
}

var Util = require('util');
var EventEmitter = require('events').EventEmitter;
Util.inherits(Manager, EventEmitter);

// load all databases we need
Manager.prototype.init = function(data) {
  this.createDays();

  // we need this information to know how recent
  // the history needs to be
  this.nextFetchAt = utc().add('ms', data.nextIn);

  this.start = util.intervalsAgo(config.EMA.candles);
  this.startMinute = this.momentToMinute(this.start);
  this.startDay = this.start.clone().startOf('day');
  
  this.today = utc().startOf('day');
  this.todayString = this.today.format('YYYY-MM-DD');

  // make sure the historical folder exists
  if(!fs.existsSync(this.historyPath))
    fs.mkdirSync(this.historyPath);
  
  this.loadDays();
}

// grab a batch of trades and for each full minute
// create a new candle
Manager.prototype.processTrades = function(data) {

  // TODO:
  // we can only do this once we know
  // how what our history looks like
  // 
  // chicken & egg problem, need better
  // solution
  if(!this.historySet) {
    log.debug('delaying processTrades');
    return this.onHistorySet = function() {
      this.processTrades(data)
    };
    // race condition fix
  } else if(!this.leftovers)
    this.createDay(true);

  // console.log('NEWEST:', this.newest.format('YYYY-MM-DD HH:mm:ss'));
  // console.log('NEWEST:', this.momentToMinute(this.newest));
  
  // filter out all trades that are do not belong to the last candle
  var trades = _.filter(data.all, function(trade) {
    return this.minumum < moment.unix(trade.date).utc();
  }, this);

  var candles = [];
  var minutes = [];

  // if we have remaining trades from last fetch
  // let's include them to this round
  if(this.leftOvers) {
    var m = this.leftOver
    candles.push(m);
    minutes.push(m.s);
  }

  var f = parseFloat;

  // bucket all trades into minutes
  _.each(trades, function(trade) {
    var mom = moment.unix(trade.date).utc();
    var min = this.momentToMinute(mom);
    if(!_.contains(minutes, min)) {
      // create a new candle
      // for this minute
      candles.push({
        s: min,
        o: f(trade.price),
        h: f(trade.price),
        l: f(trade.price),
        c: f(trade.price),
        v: f(trade.amount)
      });
      minutes.push(min);
    } else {
      // update h, l, c, v
      var m = _.last(candles);
      m.h = _.max([m.h, f(trade.price)]);
      m.l = _.min([m.l, f(trade.price)]);
      m.c = f(trade.price);
      m.v += f(trade.amount);
    }
  }, this);

  // console.log(candles);

  // TODO: think about best solution:
  // the more info we drop here the bigger
  // the drop, but we need a way to note
  // that these candles are not 100% full
  // 
  // if(!this.leftOver) {
  //   // this is the first time, since we don't
  //   // know if we got the full minute drop it.
  //   candles.shift();
  // }

  // since we don't know if we have the full minute
  // for the last one, pop it under leftovers
  this.leftovers = candles.pop();

  if(_.size(candles))
    this.storeCandles(candles);
  else
    log.debug('Not enough data for new candle, maybe next round')

  if(this.leftovers)
    log.debug('Leftovers:', this.leftovers.s);

  var last = _.last(trades);
  if(last)
    this.minumum = moment.unix(last.date).utc();
  else
    console.log('why is this called without trades?')
}

// TODO: make sure this.today gets updates
// ALSO catch some candles being in day A and
// a couple being in day B
Manager.prototype.storeCandles = function(candles) {
  _.each(candles, function(c) {
    log.debug(
      'inserting candle',
      c.s,
      '(' + this.minuteToMoment(c.s).format('HH:mm:ss') + ')'
    );
  }, this);
  this.days[this.todayString].handle.insert(candles, function(err) {
    if(err)
      log.warn('DOUBLE UNIQUE INSERT')
  });
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
  var day = this.startDay.clone();

  this.oldestDay = false;
  this.newestDay = false;

  var days = [];
  while(day <= this.today) {
    days.push(day.clone());
    day.add('d', 1);
  };

  // load & verify each day
  var iterator = function(day, next) {
    this.loadDay(day, _.bind(function(day) {
      this.verifyDay(day, next);
    }, this));
  }

  // we're done, interpetet results
  var checked = function() {
    this.setHistoryAge();
    if(!this.oldestDay) {
      this.emit('history', false);
    } else {
      // we have *ungapped* historical data
      var start = this
        .minuteToMoment(this.oldestMinute, this.oldestDay);

      var end = this
        .minuteToMoment(this.newestMinute, this.newestDay);

      this.emit('history', {
        start: start,
        end: end
      });
    }
  }

  async.some(
    days.reverse(),
    _.bind(iterator, this), 
    _.bind(checked, this)
  );
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

  if(day.empty) {
    this.deleteDay(day);
    return next(false);
  }

  // store a global reference
  this.days[day.string] = day;

  this.newestDay = day.time;
  this.newestMinute = day.end.s;

  // if this day doesn't end at midnight
  // we can't use any data it has
  // 
  // except when it's about today
  if(
    day.end !== MINUTES_IN_DAY &&
    !equals(this.today, day.time)
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
  if(this.newestMinute)
    this.newest = this.minuteToMoment(this.newestMinute, this.newestDay);
  else
    this.newest = utc().subtract(1, 'years');
  this.minumum = this.newest.clone().endOf('minute');

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
Manager.prototype.createDays = function() {
  var midnight = utc()
    .endOf('day')
    .subtract('h', 1);

  var untilMidnight = midnight.diff(utc());

  setTimeout(_.bind(function() {
    this.createDay();
    setInterval(this.createDay, +moment.duration(1, 'days'));
  }, this), untilMidnight);
  
}

// create a new daily database
Manager.prototype.createDay = function(today) {
  var day = utc()
    .startOf('day');

  if(!today)
    day.add('d', 1);

  var string = day.format('YYYY-MM-DD');

  if(today && string in this.days)
    return log.debug('Daily database already exists, skipping create');
  else
    log.debug('Creating a new daily database for day', string);

  var file = this.historyPath + [
    config.watch.exchange,
    config.watch.currency,
    config.watch.asset,
    string + '.db'
  ].join('-');

  var db = new nedb({filename: file, autoload: true});
  db.ensureIndex({fieldName: 's', unique: true});

  this.days[string] = {
    string: string,
    handle: db
  };
}

// load a daily database
// 
// returns the name if succeeded
// returns false otherwise
Manager.prototype.loadDay = function(day, next) {
  var string = day.format('YYYY-MM-DD');
  var file = this.historyPath + [
    config.watch.exchange,
    config.watch.currency,
    config.watch.asset,
    string + '.db'
  ].join('-');

  if(fs.existsSync(file)) {
    // load it and set meta
    var db = new nedb({filename: file, autoload: true});
    db.ensureIndex({fieldName: 's', unique: true});
    var day = {
      handle: db,
      time: day,
      filename: file,
      string: string
    };

    day.handle.find({}, function(err, minutes) {
      if(err)
        throw err;

      day.minutes = _.size(minutes);
      if(day.minutes === 0) {
        day.empty = true;
      } else {
        day.full = day.minutes === MINUTES_IN_DAY;
        day.start = _.min(minutes, function(m) { return m.s; } );
        day.end = _.max(minutes, function(m) { return m.s; } );
      }
      next(day);
    });
  } else
    next(false);
}

Manager.prototype.minuteToMoment = function(minutes, day) {
  if(!day)
    day = this.today;
  day = day.clone().startOf('day');
  return day.clone().add('minutes', minutes);
};

Manager.prototype.momentToMinute = function(moment) {
  var start = moment.clone().startOf('day');
  return Math.floor(moment.diff(start) / 1000 / 60);
};

module.exports = new Manager;