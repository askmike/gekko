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
          const body = this.createResponse("#439FE0","Gekko started!") ;
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

	const color = advice.recommendation === "long" ? "good" : (advice.recommendation === "short" ? "danger" : "warning");
  const body = this.createResponse(color, "There is a new trend! The advice is to go `" + advice.recommendation + "`! Current price is `" + this.price + "`");

  this.send(body);
};

Slack.prototype.send = function(content, done) {
    this.slack.chat.postMessage(slackConfig.channel, "", content, (error, response) => {
      if (error || !response) {
        log.error('Slack ERROR:', error);
      } else {
        log.info('Slack Message Sent');
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

Slack.prototype.createResponse = function(color, message) {
  const template = {
    "username": this.createUserName(),
    "icon_url": this.createIconUrl(),
    "attachments": [
      {
        "fallback": "",
        "color": color,
        "text": message,
        "mrkdwn_in": ["text"]
      }
    ]
  };

  return template;
};

Slack.prototype.createUserName = function() {
  return config.watch.exchange[0].toUpperCase() + config.watch.exchange.slice(1) + " - " + config.watch.currency + "/" + config.watch.asset;
};

Slack.prototype.createIconUrl = function() {
  const asset = config.watch.asset === "XBT" ? "btc" :config.watch.asset.toLowerCase();
  return "https://github.com/cjdowner/cryptocurrency-icons/raw/master/128/icon/" + asset + ".png";
};

module.exports = Slack;
