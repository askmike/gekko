
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

  this.nextFetchAt = utc().subtract('ms', data.nextIn);

  this.start = util.intervalsAgo(config.EMA.candles);
  this.startMinute = this.momentToMinute(this.start);
  this.startDay = this.start.clone().startOf('day');
  this.today = utc().startOf('day');

  // make sure the historical folder exists
  if(!fs.existsSync(this.historyPath))
    fs.mkdirSync(this.historyPath);
  
  this.loadDays();
}

Manager.prototype.processTrades = function(trades) {

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
    if(!this.oldestDay)
      this.emit('history', false);
    else {
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
//      check if up to now - 10 min (or smth)
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
    this.deleteDay(db);
    return next(false);
  }

  // store a global reference
  this.days[day.string] = day;

  // if we don't already have the newest
  // day this is the most recent day so 
  // this holds the newest data
  if(!this.newestDay) {

    // verify that it's recent enough,
    // else we can drop everything because
    // the whole history is too old
    var age = this.minuteToMoment(day.end, day.time);
    if(age > this.nextFetchAt) {

      // hacky way to propogate error
      // to the candlemanager
      this.emit('historical data outdated')
      return next(false);
    }

    this.newestDay = day.time;
    this.newestMinute = day.end;
  }

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
  if(db.start !== 0)
    return next(false);

  next(true);
}

// setup an interval to create new daily files 
// every day at 11PM.
Manager.prototype.createDays = function() {
  var midnight = utc()
    .endOf('day')
    .subtract('h', 1)
    .diff();

  var untilMidnight = utc().diff(midnight);

  setTimeout(_.bind(function() {
    this.createDay();
    setInterval(this.createDay, +moment.duration(1, 'days'));
  }, this));
  
}

// create a new daily database
Manager.prototype.createDay = function() {
  var day = utc()
    .startOf('day')
    .add('d', 1);

  var string = day.format('YYYY-MM-DD');

  log.debug('Creating a new daily database for day', string);

  var file = this.historyPath + [
    config.watch.exchange,
    config.watch.currency,
    config.watch.asset,
    string
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
    string
  ].join('-');

  if(fs.exists(file)) {
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
  day = day.clone().startOf('day');
  return day.clone().add('minutes', minutes);
};

Manager.prototype.momentToMinute = function(moment) {
  var start = moment.clone().startOf('day');
  return Math.floor(moment.diff(start) / 1000 / 60);
};

module.exports = new Manager;