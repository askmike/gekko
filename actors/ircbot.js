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

  if(text === ';;real advice')
    this.emitRealAdvice();
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
    ' is ',
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

Actor.prototype.emitRealAdvice = function() {
  // http://www.examiner.com/article/uncaged-a-look-at-the-top-10-quotes-of-gordon-gekko
  // http://elitedaily.com/money/memorable-gordon-gekko-quotes/
  var realAdvice = [
    'I don\'t throw darts at a board. I bet on sure things. Read Sun-tzu, The Art of War. Every battle is won before it is ever fought.',
    'Ever wonder why fund managers can\'t beat the S&P 500? \'Cause they\'re sheep, and sheep get slaughtered.',
    'If you\'re not inside, you\'re outside!',
    'The most valuable commodity I know of is information.',
    'It\'s not a question of enough, pal. It\'s a zero sum game, somebody wins, somebody loses. Money itself isn\'t lost or made, it\'s simply transferred from one perception to another.',
    'What’s worth doing is worth doing for money.',
    'When I get a hold of the son of a bitch who leaked this, I’m gonna tear his eyeballs out and I’m gonna suck his fucking skull.'
  ];

  this.bot.say(ircbot.channel, _.first(_.shuffle(realAdvice)));
}


module.exports = Actor;