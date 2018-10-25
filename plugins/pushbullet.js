/**
 * Created by rocketman1337345 on 8/14/16.
 * Extended by RJPGriffin (Gryphon) on 30/5/18
 */


/**
Required Config:

config.pushbullet = {
  // sends pushbullets if true
  enabled: true,
  // Send 'Gekko starting' message if true
  sendMessageOnStart: true,
  // Send Message for advice?
  sendOnAdvice: true,
  // Send Message on Trade Completion?
  sendOnTrade: true,
  // disable advice printout if it's soft
  muteSoft: true,
  // your pushbullet API key
  key: '',
  // your email
  email: 'jon_snow@westeros.com',
  // Messages will start with this tag
  tag: '[GEKKO]'
};


 **/

var pushbullet = require("pushbullet");
var _ = require('lodash');
const moment = require('moment');
var log = require('../core/log.js');
var util = require('../core/util.js');
var config = util.getConfig();
var pushbulletConfig = config.pushbullet;

var Pushbullet = function(done) {
  _.bindAll(this);

  this.pusher;
  this.price = 'N/A';

  this.advicePrice = 0;
  this.adviceTime = moment();

  this.done = done;
  this.setup();
};

Pushbullet.prototype.setup = function(done) {

  var setupPushBullet = function(err, result) {
    if (pushbulletConfig.sendMessageOnStart) {
      var title = pushbulletConfig.tag;
      var exchange = config.watch.exchange;
      var currency = config.watch.currency;
      var asset = config.watch.asset;
      var body = "Gekko has started watching " +
        currency +
        "/" +
        asset +
        " on " +
        exchange +
        ".";

      if (config.trader.enabled) {
        body += "\nLive Trading is enabled"
      }
      if (config.paperTrader.enabled) {
        body += "\nPaper Trading is enabled"
      }
      this.mail(title, body);
    } else {
      log.debug('Skipping Send message on startup')
    }
  };
  setupPushBullet.call(this)
};

Pushbullet.prototype.processCandle = function(candle, done) {
  this.price = candle.close;

  done();
};


Pushbullet.prototype.processAdvice = function(advice) {
  if (advice.recommendation == "soft" && pushbulletConfig.muteSoft) return;

  this.advicePrice = this.price;
  this.adviceTime = advice.date;

  if (pushbulletConfig.sendOnAdvice) {

    var text = [
      'Gekko has new advice for ',
      config.watch.exchange,
      ', advice is to go ',
      advice.recommendation,
      '.\n\nThe current ',
      config.watch.asset,
      ' price is ',
      this.advicePrice
    ].join('');

    var subject = pushbulletConfig.tag + ' New advice: go ' + advice.recommendation;

    this.mail(subject, text);
  }
};

Pushbullet.prototype.processTradeCompleted = function(trade) {
  if (pushbulletConfig.sendOnTrade) {
    var slip;
    //Slip direction is opposite for buy and sell
    if (trade.price === this.advicePrice) {
      slip = 0;
    } else if (trade.action === 'buy') {
      slip = 100 * ((trade.price - this.advicePrice) / this.advicePrice);
    } else if (trade.action === 'sell') {
      slip = 100 * ((this.advicePrice - trade.price) / this.advicePrice);
    } else {
      slip = '1234';
    }

    let tradeTime = trade.date;
    let diff = tradeTime.diff(this.adviceTime);
    let timeToComplete = moment.utc(diff).format("mm:ss");


    // timeToComplete = trade.date - this.adviceTime;
    // timeToComplete.format('h:mm:ss');

    var text = [
      config.watch.exchange,
      ' ',
      config.watch.asset,
      '/',
      config.watch.currency,
      '\nAdvice Price: ',
      this.advicePrice,
      '\nTrade Price: ',
      trade.price,
      '\nSlip: ',
      slip.toFixed(2), '%',
      '\nAdvice Time: ',
      this.adviceTime.format("h:mm:ss"),
      '\nTrade Time: ',
      tradeTime.format("h:mm:ss"),
      '\nTime to Fill: ',
      timeToComplete

    ].join('');

    var subject = '';


    subject = pushbulletConfig.tag + ' ' + trade.action + ' Complete ';


    this.mail(subject, text);
  }
};

Pushbullet.prototype.mail = function(subject, content, done) {
  var pusher = new pushbullet(pushbulletConfig.key);
  pusher.note(pushbulletConfig.email, subject, content, function(error, response) {
    if (error || !response) {
      log.error('Pushbullet ERROR:', error)
    } else if (response && response.active) {
      log.info('Pushbullet Message Sent')
    }
  });
};

Pushbullet.prototype.checkResults = function(err) {
  if (err)
    log.warn('error sending pushbullet message', err);
  else
    log.info('Send advice via pushbullet message.');
};

module.exports = Pushbullet;