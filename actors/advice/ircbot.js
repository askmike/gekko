var log = require('../../core/log');
var moment = require('moment');
var _ = require('lodash');
var config = require('../../core/util').getConfig();
var utc = moment.utc;

var irc = require("irc");

var Actor = function(next) {
  _.bindAll(this);

  this.name = 'IRC bot';

  this.bot = new irc.Client(config.irc.server, config.irc.botName, {
    channels: config.irc.channels
  });

  this.bot.addListener("message", this.verifyQuestion);

  this.advice = 'Dont got one yet :(';
  this.adviceTime = utc();

  this.price = 'Dont know yet :(';
  this.priceTime = utc();

  next();
}

Actor.prototype.init = function(history) {
  // process last candle as now
  this.processCandle(_.last(history.candles));
};

Actor.prototype.processCandle = function(candle) {
  this.price = candle.c;

  // we got a 1m candle, last time is 60 seconds after it.
  this.priceTime = candle.start.clone().local().add('m', 1);
};

Actor.prototype.processAdvice = function(advice) {
  this.advice = advice.recommandation;
  this.adviceTime = utc();
};

Actor.prototype.verifyQuestion = function(from, to, text, message) {
  if(text === ';;advice')
    this.emitAdvice();

  if(text === ';;price')
    this.emitPrice();
}

Actor.prototype.newAdvice = function() {
  this.bot.say(ircConfig.channels[0], 'Guys! Important news!');
  this.emitAdvice();
}

// sent advice over to the IRC channel
Actor.prototype.emitAdvice = function() {
  var message = [
    'Advice for market ',
    config.watch.exchange,
    ' ',
    config.watch.currency,
    '/',
    config.watch.asset,
    ' using EMA ',
    config.EMA.long,
    '/',
    config.EMA.short,
    ' at ',
    config.EMA.interval,
    'minute candles, is:\n',
    this.advice,
    ' ',
    config.watch.asset,
    ' (from ',
      this.adviceTime.fromNow(),
    ')'
  ].join('');

  this.bot.say(config.irc.channels[0], message);
};

// sent price over to the IRC channel
Actor.prototype.emitPrice = function() {

  var message = [
    'Current price at market ',
    config.watch.exchange,
    ' ',
    config.watch.currency,
    '/',
    config.watch.asset,
    ' is:\n',
    this.price,
    ' ',
    config.watch.currency,
    ' (from ',
      this.priceTime.fromNow(),
    ')'
  ].join('');

  this.bot.say(config.irc.channels[0], message);
};


module.exports = Actor;