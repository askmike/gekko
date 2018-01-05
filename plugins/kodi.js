/**
 * Created by billymcintosh on 24/12/17.
 */

var _ = require('lodash');
var request = require('request');
var log = require('../core/log.js');
var util = require('../core/util.js');
var config = util.getConfig();
var kodiConfig = config.kodi;

var Kodi = function(done) {
    _.bindAll(this);

    this.exchange = config.watch.exchange.charAt().toUpperCase() + config.watch.exchange.slice(1)

    this.price = 'N/A';
    this.done = done;
    this.setup();
};

Kodi.prototype.setup = function(done) {
    var setupKodi = function (err, result) {
        if(kodiConfig.sendMessageOnStart) {
            var currency = config.watch.currency;
            var asset = config.watch.asset;
            var title = "Gekko Started";
            var message = `Watching ${this.exchange} - ${currency}/${asset}`;
            this.mail(title, message);
        } else {
            log.debug('Skipping Send message on startup')
        }
    }
    setupKodi.call(this)
};

Kodi.prototype.processCandle = function(candle, done) {
    this.price = candle.close;

    done();
};

Kodi.prototype.processAdvice = function(advice) {
    var title = `Gekko: Going ${advice.recommendation} @ ${this.price}`
    var message = `${this.exchange} ${config.watch.currency}/${config.watch.asset}`;
    this.mail(title, message);
};

Kodi.prototype.mail = function(title, message, done) {
    var options = {
      body: `{"jsonrpc":"2.0","method":"GUI.ShowNotification","params":{"title":"${title}","message":"${message}"},"id":1}`,
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST',
      url: kodiConfig.host
    }

    request(options, (error, response, body) => {
        if (!error) {
            log.info('Kodi message sent')
        } else {
            log.debug(`Kodi ${error}`)
        }
    })
}

module.exports = Kodi;
