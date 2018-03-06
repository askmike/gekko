const log = require('../core/log');
const moment = require('moment');
const _ = require('lodash');
const config = require('../core/util').getConfig();
const telegrambot = config.telegrambot;
const utc = moment.utc;
const telegram = require("node-telegram-bot-api");

const Actor = function() {
  _.bindAll(this);

  this.advice = null;
  this.adviceTime = utc();

  this.price = 'Dont know yet :(';
  this.priceTime = utc();

  this.commands = {
    '/start': 'emitStart',
    '/advice': 'emitAdvice',
    '/subscribe': 'emitSubscribe',
    '/unsubscribe': 'emitUnSubscribe',
    '/price': 'emitPrice',
    '/help': 'emitHelp'
  };
  if (telegrambot.donate) {
    this.commands['/donate'] = 'emitDonate';
  }
  this.rawCommands = _.keys(this.commands);
  this.chatId = null;
  this.subscribers = [];
  this.bot = new telegram(telegrambot.token, { polling: true });
  this.bot.onText(/(.+)/, this.verifyQuestion);
};

Actor.prototype.processCandle = function(candle, done) {
  this.price = candle.close;
  this.priceTime = candle.start;

  done();
};

Actor.prototype.processAdvice = function(advice) {
  if (advice.recommendation === 'soft') return;
  this.advice = advice.recommendation;
  this.adviceTime = utc();
  this.advicePrice = this.price;
  this.subscribers.forEach(this.emitAdvice, this);
};

Actor.prototype.verifyQuestion = function(msg, text) {
  this.chatId = msg.chat.id;
  if (text[1].toLowerCase() in this.commands) {
    this[this.commands[text[1].toLowerCase()]]();
  } else {
    this.emitHelp();
  }
};

Actor.prototype.emitStart = function() {
  this.bot.sendMessage(this.chatId, 'Hello! How can I help you?');
};

Actor.prototype.emitSubscribe = function() {
  if (this.subscribers.indexOf(this.chatId) === -1) {
    this.subscribers.push(this.chatId);
    this.bot.sendMessage(this.chatId, `Success! Got ${this.subscribers.length} subscribers.`);
  } else {
    this.bot.sendMessage(this.chatId, "You are already subscribed.");
  }
};

Actor.prototype.emitUnSubscribe = function() {
  if (this.subscribers.indexOf(this.chatId) > -1) {
    this.subscribers.splice(this.subscribers.indexOf(this.chatId), 1);
    this.bot.sendMessage(this.chatId, "Success!");
  } else {
    this.bot.sendMessage(this.chatId, "You are not subscribed.");
  }
};

Actor.prototype.emitAdvice = function(chatId) {
  let message = [
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
  ].join('');
  if (this.advice) {
    message += this.advice +
      ' ' +
      config.watch.asset +
      ' ' +
      this.advicePrice +
      ' (' +
      this.adviceTime.fromNow() +
      ')';
  } else {
    message += 'None'
  }

  if (chatId) {
    this.bot.sendMessage(chatId, message);
  } else {
    this.bot.sendMessage(this.chatId, message);
  }
};

// sent price over to the last chat
Actor.prototype.emitPrice = function() {
  const message = [
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

  this.bot.sendMessage(this.chatId, message);
};

Actor.prototype.emitDonate = function() {
  this.bot.sendMessage(this.chatId, telegrambot.donate);
};

Actor.prototype.emitHelp = function() {
  let message = _.reduce(
    this.rawCommands,
    function(message, command) {
      return message + ' ' + command + ',';
    },
    'Possible commands are:'
  );
  message = message.substr(0, _.size(message) - 1) + '.';
  this.bot.sendMessage(this.chatId, message);
};

Actor.prototype.logError = function(message) {
  log.error('Telegram ERROR:', message);
};

module.exports = Actor;
