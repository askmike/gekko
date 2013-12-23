
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

var util = require('./util');
var config = util.getConfig();

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

  this.init();
  this.on('empty history', function() {
    console.log('empty history');
  });
}

var Util = require('util');
var EventEmitter = require('events').EventEmitter;
Util.inherits(Manager, EventEmitter);

// load all databases we need
Manager.prototype.init = function() {

  this.start = util.intervalsAgo(config.EMA.candles);
  this.startMinute = this.momentToMinute(this.start);
  this.startDay = this.start.clone().startOf('day');

  // make sure the historical folder exists
  if(!fs.existsSync(this.historyPath))
    fs.mkdirSync(this.historyPath);
  
  var day = this.startDay.clone();
  this.today = utc().startOf('day');
  var neededDays = [];

  while(day <= this.today) {
    neededDays.push(day.clone());
    day.add('d', 1);
  };

  // load those days
  _.each(neededDays, function(day) {
    var success = this.loadDay(day);
  }, this);

  this.verifyDays(neededDays);
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

  delete this.days[day.string];
}

Manager.prototype.verifyDays = function(neededDays) {
  if(_.size(this.days) !== _.size(neededDays))
    return console.log('~~~~, we couldnt load all days we needed');

  // check if we have all data we need per day
  var verifyEachDay = _.after(_.size(this.days), _.bind(function() {

    // remove all empty days
    _.each(this.days, function(day) {
      if(day.empty)
        this.deleteDay(day, false);
    }, this);

    // check for gaps
    _.each(_.clone(this.days), function(day, i) {
      
      var isToday = util.equals(this.today, day.time);
      var isStartDay = util.equals(this.startDay, day.time);

      if(isToday) {
        if(day.minutes !== day.end)
          // we have a gap in today
          throw 'gap in today';
      } else if(isStartDay) {

        // if the end day didn't finish
        // we have a gap in startDay
        if(day.end !== MINUTES_IN_DAY)
          throw 'end day didn\t finish';

        if(day.start > this.startMinute)
          throw 'we don\'t have enough of startDay';

      } else {
        // if the day is not the start day
        // and not today and it is incomplete
        // we have a gap in our data.
        if(day.minutes !== MINUTES_IN_DAY)
          this.deleteDay(day, false);
        else
          log.debug('Got full history for', day.string);
      }
        

    }, this);
  }, this));

  // grab everything out of each DB
  _.each(this.days, function(day) {
    // console.log(day);
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
      verifyEachDay();
    });
  });

  // if after deleting corrupted stuff we don't
  // have anything left anymore, upstream that info
  // console.log(this);
  if(!_.size(this.days))
    return this.emit('empty history');
}

Manager.prototype.minuteToMoment = function(minutes, day) {
  day = day.clone().startOf('day');
  return day.clone().add('minutes', minutes);
};

Manager.prototype.momentToMinute = function(moment) {
  var start = moment.clone().startOf('day');
  return Math.floor(moment.diff(start) / 1000 / 60);
};

Manager.prototype.loadDay = function(day) {
  var string = day.format('YYYY-MM-DD');
  var file = this.historyPath + [
    config.watch.exchange,
    config.watch.currency,
    config.watch.asset,
    string
  ].join('-');

  // if(fs.exists(file)) {
    var db = new nedb({filename: file, autoload: true});
    db.ensureIndex({fieldName: 's', unique: true});
    this.days[string] = {
      handle: db,
      time: day,
      filename: file,
      string: string
    };
  // } else {
    // this.days.push({time: day});
    // console.log('failed to load', file);
  // }
    // return false;
}

module.exports = new Manager;