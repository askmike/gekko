var log = require('../core/log');
var moment = require('moment');
var _ = require('lodash');
var config = require('../core/util').getConfig();
var ircbot = config.ircbot;
var utc = moment.utc;

var irc = require("irc");

var Actor = function() {
  _.bindAll(this);

  this.bot = new irc.Client(ircbot.server, ircbot.botName, {
    channels: [ ircbot.channel ] 
  });

  this.bot.addListener("message", this.verifyQuestion);

  this.advice = 'Dont got one yet :(';
  this.adviceTime = utc();

  this.price = 'Dont know yet :(';
  this.priceTime = utc();
}

Actor.prototype.processTrade = function(trade) {
  this.price = trade.price;
  this.priceTime = moment.unix(trade.date);
};

Actor.prototype.processAdvice = function(advice) {
  this.advice = advice.recommandation;
  this.adviceTime = utc();

  if(ircbot.emitUpdats)
    this.newAdvice();
};

Actor.prototype.verifyQuestion = function(from, to, text, message) {
  if(text === ';;advice')
    this.emitAdvice();

  if(text === ';;price')
    this.emitPrice();

  if(text === ';;donate')
    this.emitDonation();
}

Actor.prototype.newAdvice = function() {
  this.bot.say(ircbot.channel, 'Guys! Important news!');
  this.emitAdvice();
}

// sent advice over to the IRC channel
Actor.prototype.emitAdvice = function() {
  var message = [
    'Advice for ',
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
    ' minute candles, is:\n',
    this.advice,
    ' ',
    config.watch.asset,
    ' (from ',
      this.adviceTime.fromNow(),
    ')'
  ].join('');

  this.bot.say(ircbot.channel, message);
};

// sent price over to the IRC channel
Actor.prototype.emitPrice = function() {

  var message = [
    'Current price at ',
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

  this.bot.say(ircbot.channel, message);
};

// sent donation info over to the IRC channel
Actor.prototype.emitDonation = function() {
  var message = 'You want to donate? How nice of you! You can send your coins here:';
  message += '\nBTC:\t13r1jyivitShUiv9FJvjLH7Nh1ZZptumwW';
  message += '\nDOGE:\tDH3n9PCmi5k2Mqs3LhDAmy4ySQ1N1xUg43';

  this.bot.say(ircbot.channel, message);
};


module.exports = Actor;