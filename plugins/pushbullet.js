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
  // Send Message for advice? Recommend Flase for paper, true for live
  sendOnAdvice: true,
  // Send Message on Trade Completion?
  sendOnTrade: true,
  // For Overall P/L calc. Pass in old balance if desired, else leave '0'
  startingBalance: '0',
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
const request = require('request');
var log = require('../core/log.js');
var util = require('../core/util.js');
var config = util.getConfig();
var pbConf = config.pushbullet;

var Pushbullet = function(done) {
  _.bindAll(this);

  this.pusher;
  this.price = 'N/A';
  this.startingBalance = pbConf.startingBalance === undefined ? 0 : Number(pbConf.startingBalance);
  this.advicePrice = 0;
  this.adviceTime = moment();
  this.lastBuyTime = moment();
  this.lastBuyBalance = 0;
  this.hasBought = 0;

  this.done = done;
  this.setup();
};

Pushbullet.prototype.setup = function(done) {

  var setupPushBullet = function(err, result) {
    if (pbConf.sendMessageOnStart) {
      var title = pbConf.tag;
      var exchange = config.watch.exchange;
      var currency = config.watch.currency;
      var asset = config.watch.asset;
      let tradeType = 'watching';
      if (config.trader.enabled) {
        tradeType = "Live Trading";
      }
      if (config.paperTrader.enabled) {
        tradeType = "Paper Trading";
      }

      var body = `Gekko has started ${tradeType} ${asset}/${currency} on ${exchange}.`;

      //If trading Advisor is enabled, add strategy and candle size information
      if (config.tradingAdvisor.enabled) {
        body += `\n\nUsing ${config.tradingAdvisor.method} strategy on M${config.tradingAdvisor.candleSize} candles.`
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

  this.advicePrice = this.price;
  this.adviceTime = advice.date;

  if (pbConf.sendOnAdvice) {

    var text = [
      'Gekko has new advice for ',
      capF(config.watch.exchange),
      ', advice is to go ',
      capF(advice.recommendation),
      '.\n\nThe current ',
      config.watch.asset,
      ' price is ',
      this.advicePrice
    ].join('');

    var subject = pbConf.tag + ' New advice: go ' + advice.recommendation;

    this.mail(subject, text);
  }
};

Pushbullet.prototype.processTradeCompleted = function(trade) {

  //Check Starting balance is initialized - if 0, initialize it
  this.startingBalance = this.startingBalance ? this.startingBalance : trade.balance;

  // If config variable doesn't exist (old config) defaults to send
  let sendOnTrade = pbConf.sendOnTrade === undefined ? 1 : pbConf.sendOnTrade;

  if (sendOnTrade) {

    // Calculate exposure Time
    let exposureTimeStr = '';
    let balanceChangeStr = '\n';
    let totBalanceChangeStr = '';
    let subject = `${pbConf.tag} ${capF(trade.action)} complete`;

    if (trade.action === 'buy') {
      this.hasBought = 1; // Flag to ensure that the following variables have been filled
      this.lastBuyTime = trade.date;
      this.lastBuyBalance = trade.balance;
    } else if (this.hasBought) { //if sell and we have previous buy data
      exposureTimeStr = `\nExposure Time: ${moment.duration(trade.date.diff(this.lastBuyTime)).humanize()}`;

      //Calculate balance change
      let oBal = this.lastBuyBalance; // Old Balance
      let nBal = trade.balance; // New Balance
      let diffBal = Math.abs(nBal - oBal); // Balance Difference
      let percDiffBal = (diffBal / oBal) * 100; // Percentage difference


      if (nBal >= oBal) { // profit!
        balanceChangeStr = `\n\nRound trip profit of: \n${getNumStr(diffBal)}${config.watch.currency} \n${getNumStr(percDiffBal,2)}%\n`
        subject = `${subject}: +${getNumStr(percDiffBal,2)}%`
      } else if (nBal < oBal) { //  Loss :(
        balanceChangeStr = `\n\nRound trip loss of: \n-${getNumStr(diffBal)}${config.watch.currency} \n-${getNumStr(percDiffBal,2)}%\n`
        subject = `${subject}: -${getNumStr(percDiffBal,2)}%`
      }

      //Calculate overall P/l
      let sBal = this.startingBalance;
      let tDiffBal = Math.abs(nBal - sBal);
      let percDiffTotBal = (tDiffBal / sBal) * 100;
      if (nBal >= sBal) { // profit!
        totBalanceChangeStr = `\nOverall gain of: \n${getNumStr(tDiffBal)}${config.watch.currency} \n${getNumStr(percDiffTotBal,2)}%\n`
      } else if (nBal < sBal) { //  Loss :(
        totBalanceChangeStr = `\nOverall loss of \n-${getNumStr(tDiffBal)}${config.watch.currency} \n-${getNumStr(percDiffTotBal,2)}%\n`

      } else if (trade.action === 'sell' && !this.hasBought) {
        balanceChangeStr = `\n\nNot enough data for exposure time, round trip or overall performance yet. This will appear after bot has completed first round trip.`
      }
    }

    let costOfTradeStr = `\nCost of Trade: ${getNumStr(trade.cost)}${config.watch.currency}, ${getNumStr(((trade.cost / (trade.amount*trade.price)) * 100), 2)}%`;

    //build strings that are only sent for Live trading, not paperTrader
    let orderFillTimeStr = '';
    let slippageStr = '';

    if (!config.paperTrader.enabled) {
      let timeToComplete = moment.duration(trade.date.diff(this.adviceTime)).humanize();
      orderFillTimeStr = `\nOrder fill Time: ${timeToComplete}`;

      var slip;
      //Slip direction is opposite for buy and sell
      if (trade.price === this.advicePrice) {
        slip = 0;
      } else if (trade.action === 'buy') {
        slip = 100 * ((trade.price - this.advicePrice) / this.advicePrice);
      } else if (trade.action === 'sell') {
        slip = 100 * ((this.advicePrice - trade.price) / this.advicePrice);
      }
      slippageStr = `\nSlipped ${getNumStr(slip,2)}% from advice @ ${getNumStr(this.advicePrice)}`;


    }

    var text = [
      capF(config.watch.exchange), ' ', config.watch.asset, '/', config.watch.currency,
      `\n\n${config.watch.asset} Trade Price: ${getNumStr(trade.price)}`,
      `\n${getPastTense(trade.action)} ${getNumStr(trade.amount)} ${config.watch.asset}`,
      orderFillTimeStr,
      slippageStr,
      costOfTradeStr,
      exposureTimeStr,
      balanceChangeStr,
      totBalanceChangeStr,
      '\nBalance: ', getNumStr(trade.balance), config.watch.currency,
    ].join('');

    this.mail(subject, text);
  }
};


// A long winded function to make sure numbers aren't displayed with too many decimal places
// and are a little humanized
function getNumStr(num, fixed = 4) {
  let numStr = '';

  if (typeof num != "number") {
    num = Number(num);
    if (isNaN(num)) {
      // console.log("Pushbullet Plugin: Number Conversion Failed");
      return "Conversion Failure";
    }
  }


  if (Number.isInteger(num)) {
    numStr = num.toString();
  } else {

    //Create modNum Max - Must be a better way...
    let modNumMax = '1';
    for (let i = 1; i < fixed; i++) {
      modNumMax = modNumMax + '0';
    }
    modNumMax = Number(modNumMax);

    let i = 0;
    if (num < 1) {
      let modNum = num - Math.floor(num);
      while (modNum < modNumMax && i < 8) {
        modNum *= 10;
        i += 1;
      }
    } else {
      i = fixed;
    }
    numStr = num.toFixed(i);
    //Remove any excess zeros
    while (numStr.charAt(numStr.length - 1) === '0') {
      numStr = numStr.substring(0, numStr.length - 1);
    }

    //If last char remaining is a decimal point, remove it
    if (numStr.charAt(numStr.length - 1) === '.') {
      numStr = numStr.substring(0, numStr.length - 1);
    }

  }

  //Add commas for thousands etc
  let dp = numStr.indexOf('.'); //find deciaml point
  if (dp < 0) { //no dp found
    dp = numStr.length;
  }

  let insPos = dp - 3;
  insCount = 0;
  while (insPos > 0) {
    insCount++;
    numStr = numStr.slice(0, insPos) + ',' + numStr.slice(insPos);
    insPos -= 3;
  }


  return (numStr);
}

function capF(inWord) { //Capitalise first letter of string
  return (inWord.charAt(0).toUpperCase() + inWord.slice(1));
}

function getPastTense(action) {
  let ret = '';
  if (action === 'buy') {
    ret = 'Bought'
  } else if (action === 'sell') {
    ret = 'Sold'
  }
  return ret;
}

Pushbullet.prototype.mail = function(subject, content, done) {
  var pusher = new pushbullet(pbConf.key);
  pusher.note(pbConf.email, subject, content, function(error, response) {
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