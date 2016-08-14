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
        var pusher = new pushbullet(pushbulletConfig.key);
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
            pusher.note(pushbulletConfig.email, title, body, function(error, response) {
                if (response.active){
                    log.info('Pushbullet Message Sent')
                }
            });
            log.debug('Setup Pushbullet adviser')
        }
    };
    setupPushBullet.call(this)
};

Pushbullet.prototype.mail = function(subject, content, done) {
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
    pusher.note(pushbulletConfig.email, title, body, function(error, response) {
        if (response.active){
            log.info('Pushbullet Message Sent')
        }
    });
    log.debug('Setup Pushbullet adviser')
};

Pushbullet.prototype.checkResults = function(err) {
    if(err)
        log.warn('error sending email', err);
    else
        log.info('Send advice via email.');
};



module.exports = Pushbullet;