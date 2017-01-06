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
  this.bot.addListener("error", this.logError);

  this.advice = 'Dont got one yet :(';
  this.adviceTime = utc();

  this.price = 'Dont know yet :(';
  this.priceTime = utc();

  this.commands = {
    ';;advice': 'emitAdvice',
    ';;price': 'emitPrice',
    ';;donate': 'emitDonation',
    ';;real advice': 'emitRealAdvice',
    ';;help': 'emitHelp'
  };

  this.rawCommands = _.keys(this.commands);
}

Actor.prototype.processCandle = function(candle, done) {
  this.price = candle.close;
  this.priceTime = candle.start;

  done();
};

Actor.prototype.processAdvice = function(advice) {
  if (advice.recommendation == "soft" && ircbot.muteSoft) return;
  this.advice = advice.recommendation;
  this.adviceTime = utc();

  if(ircbot.emitUpdates)
    this.newAdvice();
};

Actor.prototype.verifyQuestion = function(from, to, text, message) {
  if(text in this.commands)
    this[this.commands[text]]();
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
    ' using ',
    config.tradingAdvisor.method,
    ' at ',
    config.tradingAdvisor.candleSize,
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

  this.bot.say(ircbot.channel, message);
};

Actor.prototype.emitHelp = function() {
  var message = _.reduce(
    this.rawCommands,
    function(message, command) {
      return message + ' ' + command + ',';
    },
    'possible commands are:'
  );

  message = message.substr(0, _.size(message) - 1) + '.';

  this.bot.say(ircbot.channel, message);

}

Actor.prototype.emitRealAdvice = function() {
  // http://www.examiner.com/article/uncaged-a-look-at-the-top-10-quotes-of-gordon-gekko
  // http://elitedaily.com/money/memorable-gordon-gekko-quotes/
  var realAdvice = [
    'I don\'t throw darts at a board. I bet on sure things. Read Sun-tzu, The Art of War. Every battle is won before it is ever fought.',
    'Ever wonder why fund managers can\'t beat the S&P 500? \'Cause they\'re sheep, and sheep get slaughtered.',
    'If you\'re not inside, you\'re outside!',
    'The most valuable commodity I know of is information.',
    'It\'s not a question of enough, pal. It\'s a zero sum game, somebody wins, somebody loses. Money itself isn\'t lost or made, it\'s simply transferred from one perception to another.',
    'What\'s worth doing is worth doing for money. (Wait, wasn\'t I a free and open source bot?)',
    'When I get a hold of the son of a bitch who leaked this, I\'m gonna tear his eyeballs out and I\'m gonna suck his fucking skull.'
  ];

  this.bot.say(ircbot.channel, _.first(_.shuffle(realAdvice)));
}

Actor.prototype.logError = function(message) {
  log.error('IRC ERROR:', message);
};


module.exports = Actor;
