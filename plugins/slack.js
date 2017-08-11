const WebClient = require('@slack/client').WebClient;
const _ = require('lodash');
const log = require('../core/log.js');
const util = require('../core/util.js');
const config = util.getConfig();
const slackConfig = config.slack;

const Slack = function(done) {
    _.bindAll(this);

    this.slack;
    this.price = 'N/A';

    this.done = done;
    this.setup();
};

Slack.prototype.setup = function(done) {
    this.slack = new WebClient(slackConfig.token);
    
    const setupSlack = function(error, result) {
        if(slackConfig.sendMessageOnStart){
            const exchange = config.watch.exchange;
            const currency = config.watch.currency;
            const asset = config.watch.asset;
            const body = 'Gekko has started, Ive started watching '
                +exchange
                +' '
                +currency
                +' '
                +asset
                +' I\'ll let you know when I got some advice';
            this.send(body);
        }else{
            log.debug('Skipping Send message on startup')
        }
    };
    setupSlack.call(this)
};

Slack.prototype.processCandle = function(candle, done) {
    this.price = candle.close;

    done();
};

Slack.prototype.processAdvice = function(advice) {
	if (advice.recommendation == 'soft' && slackConfig.muteSoft) return;

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

Slack.prototype.send = function(content, done) {
    this.slack.chat.postMessage(slackConfig.channel, content, (error, response) => {
      if (error || !response) {
        log.error('Slack ERROR:', error)
      } else {
        log.info('Slack Message Sent')
      }
    });
};

Slack.prototype.checkResults = function(error) {
    if (error) {
        log.warn('error sending slack', error);
    } else {
        log.info('Send advice via slack.');
    }
};

module.exports = Slack;