var email = require("emailjs");
var moment = require('moment');
var log = require('./log.js');
var util = require('./util.js');
var _ = require('lodash');
var config = util.getConfig().mail;
var server;

module.exports.init = function(callback) {
  var setupMail = function(err, result) {
    if(result) {
      log.info('Got it.');
      config.password = result.password;
    }

    server = email.server.connect({
      user: config.email,
      password: config.password,
      host: "smtp.gmail.com",
      ssl: true
    });

    if(config.sendMailOnStart) {
      server.send({
        from: "Gekko <" + config.email + ">",
        to: "Bud Fox <" + config.email + ">",
        subject: "Gekko has started",
        text: [
          "I've just started watching the markets, ",
          "I'll let you know when I got some advice"
        ].join('')
      }, send);
    }

    log.debug('Setup email adviser.');
    callback();
  }

  if(!config.password) {
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
    prompt.get({name: 'password', hidden: true}, setupMail);
  } else {
    setupMail(false, false);
  }
}

var send = function(err) {
  if(err)
    log.warn('ERROR SENDING MAIL', err);
  else
    log.info('Send advice via email.');
}

module.exports.send = function(what, price, meta) {
  if (!_.contains(config.what, what))
    return;

  var text = [
    'Gekko is watching the bitcoin market and has detected a new trend, advice is to ' + what,
    'The current BTC price is ' + price,
    '',
    'Additional information:\n',
    meta
  ].join('\n');

  server.send({
    text: text,
    from: "Gekko <" + config.email + ">",
    to: "Bud Fox <" + config.email + ">",
    subject: "New Gekko advice: " + what
  }, send);
}
