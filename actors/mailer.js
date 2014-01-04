var email = require("emailjs");
var _ = require('lodash');
var log = require('../core/log.js');
var util = require('../core/util.js');
var config = util.getConfig();
var mailConfig = config.mailer;

var Mailer = function(done) {
  _.bindAll(this);

  this.server;
  this.price = 'N/A';

  this.done = done;
  this.setup();
}

Mailer.prototype.setup = function(done) {
  var setupMail = function(err, result) {
    if(result) {
      log.info('Got it.');
      mailConfig.password = result.password;
    }

    this.server = email.server.connect({
      user: mailConfig.email,
      password: mailConfig.password,
      host: mailConfig.server,
      ssl: mailConfig.ssl
    });

    if(mailConfig.sendMailOnStart) {
      this.mail(
        "Gekko has started",
        [
          "I've just started watching",
          config.watch.exchange,
          ' ',
          config.watch.currency,
          '/',
          config.watch.asset,
          ". I'll let you know when I got some advice"
        ].join(''),
        _.bind(function(err) {
          this.checkResults(err);
          this.done();
        }, this)
      );
    } else
      this.done();

    log.debug('Setup email adviser.');
  }

  if(!mailConfig.password && mailConfig.user) {
    // ask for the mail password
    var prompt = require('prompt-lite');
    prompt.start();
    var warning = [
      '\n\n\tYou configured Gekko to mail you advice, Gekko needs your email',
      'password to send emails (to you). Gekko is an opensource project',
      '[ http://github.com/askmike/gekko ], you can take my word but always',
      'check the code yourself.',
      '\n\n\tWARNING: If you have not downloaded Gekko from the github page above we',
      'CANNOT garantuee that your email address & password are safe!\n'
    ].join('\n\t');
    log.warn(warning);
    prompt.get({name: 'password', hidden: true}, _.bind(setupMail, this));
  } else {
    setupMail.call(this, false, false);
  }
}

Mailer.prototype.mail = function(subject, content, done) {
  this.server.send({
    text: content,
    from: "Gekko <" + mailConfig.email + ">",
    to: "Bud Fox <" + mailConfig.email + ">",
    subject: subject
  }, done || this.checkResults);
}

Mailer.prototype.processTrade = function(trade) {
  this.price = trade.price;
}

Mailer.prototype.processAdvice = function(advice) {
  var text = [
    'Gekko is watching ',
    config.watch.exchange,
    ' and has detected a new trend, advice is to go ',
    advice.recommandation,
    '.\n\nThe current ',
    config.watch.asset,
    ' price is ',
    this.price
  ].join('');

  var subject = 'Gekko has new advice: go ' + advice.recommandation;

  this.mail(subject, text);
}

Mailer.prototype.checkResults = function(err) {
  if(err)
    log.warn('error sending email', err);
  else
    log.info('Send advice via email.');
}

module.exports = Mailer;
