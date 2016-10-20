/**
 * Created by rocketman1337345 on 8/14/16.
 */

var pushbullet = require("pushbullet");
var _ = require('lodash');
var log = require('../core/log.js');
var util = require('../core/util.js');
var config = util.getConfig();
var pushbulletConfig = config.pushbullet;

var Pushbullet = function(done) {
    _.bindAll(this);

    this.pusher;
    this.price = 'N/A';

    this.done = done;
    this.setup();
};

Pushbullet.prototype.setup = function(done){

    var setupPushBullet = function (err, result) {
        if(pushbulletConfig.sendMessageOnStart){
            var title = pushbulletConfig.tag;
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
            this.mail(title, body);
        }else{
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

	var text = [
        'Gekko is watching ',
        config.watch.exchange,
        ' and has detected a new trend, advice is to go ',
        advice.recommendation,
        '.\n\nThe current ',
        config.watch.asset,
        ' price is ',
        this.price
    ].join('');

    var subject = pushbulletConfig.tag+' New advice: go ' + advice.recommendation;

    this.mail(subject, text);
};

Pushbullet.prototype.mail = function(subject, content, done) {
    var pusher = new pushbullet(pushbulletConfig.key);
    pusher.note(pushbulletConfig.email, subject, content, function(error, response) {
        if(error || !response) {
            log.error('Pushbullet ERROR:', error)
        } else if(response && response.active){
            log.info('Pushbullet Message Sent')
        }
    });
};

Pushbullet.prototype.checkResults = function(err) {
    if(err)
        log.warn('error sending email', err);
    else
        log.info('Send advice via email.');
};

module.exports = Pushbullet;