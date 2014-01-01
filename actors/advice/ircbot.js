var log = require('../../core/log');
var moment = require('moment');
var _ = require('lodash');
var config = require('../../core/util').getConfig();
var utc = moment.utc;

var irc = require("irc");

var Actor = function(next) {
  _.bindAll(this);

  console.log('setting up irc client');
  this.bot = new irc.Client(config.irc.server, config.irc.botName, {
    channels: config.irc.channels
  });

  this.bot.addListener("message", this.verifyQuestion);

  this.advice = 'Dont got one yet :(';
  this.adviceTime = utc();

  next();
}

Actor.prototype.processAdvice = function(advice) {
  this.advice = advice.recommandation;
  this.adviceTime = utc();
};

Actor.prototype.verifyQuestion = function(from, to, text, message) {
  if(text === ';;advice')
    this.emitAdvice();
}

Actor.prototype.newAdvice = function() {
  this.bot.say(ircConfig.channels[0], 'Guys! Important news!');
  this.emitAdvice();
}

// sent it over on the IRC channel
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


module.exports = Actor;