const superagent = require('superagent');
const _ = require('lodash');
const log = require('../core/log.js');
const util = require('../core/util.js');
const config = util.getConfig();
const iftttConfig = config.ifttt;

const IFTTT = function(done) {
  _.bindAll(this);
  this.ifttt;
  this.price = 'N/A';
  this.done = done;
  this.setup();
};

IFTTT.prototype.setup = function(done) {
  var setupIFTTT = function () {
    if(iftttConfig.sendMessageOnStart){
      var exchange = config.watch.exchange;
      var currency = config.watch.currency;
      var asset = config.watch.asset;
      var body = "Gekko has started, Ive started watching "
        +exchange
        +" "
        +currency
        +" "
        +asset
        +" I'll let you know when I got some advice";
      this.send(body);
    }else{
      log.debug('Skipping Send message on startup')
    }
  };
  setupIFTTT.call(this)
};

IFTTT.prototype.processCandle = function(candle, done) {
  this.price = candle.close;

  done();
};

IFTTT.prototype.portfolioUpdate = function(portfolio) {
  var message = "Gekko has detected a portfolio update. " +
    "Your current " + config.watch.currency + " balance is " + portfolio.currency + '.' +
    "Your current " + config.watch.exchange + " balance is " + portfolio.assert + '.';
  this.send(message);
}

IFTTT.prototype.processAdvice = function(advice) {
  if (advice.recommendation == 'soft' && iftttConfig.muteSoft) return;

  const text = [
    'Gekko is watching ',
    config.watch.exchange,
    ' and has detected a new trend, advice is to go ',
    advice.recommendation,
    '.\n\nThe current ',
    config.watch.asset,
    ' price is ',
    this.price
  ].join('');

  this.send(text);
};

IFTTT.prototype.send = function(content) {
  superagent.
    post('https://maker.ifttt.com/trigger/' + iftttConfig.eventName + '/with/key/' + iftttConfig.makerKey)
    .send({value1: content})
    .end(function(err, res){
      if(err || !res){
        log.error('IFTTT ERROR:', error)
      }else{
        log.info('IFTTT Message Sent')
      }
    });
};

IFTTT.prototype.checkResults = function(error) {
  if (error) {
    log.warn('error sending IFTTT', error);
  } else {
    log.info('Send advice via IFTTT.');
  }
};

module.exports = IFTTT;
