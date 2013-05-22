var email   = require("emailjs");
var moment = require('moment');
var util = require('./util.js');
var server, config;

module.exports.init = function(conf, callback) {
  config = conf;

  var setupMail = function(err, result) {
    if(result) {
      console.log('\n' + util.now(), 'Got it.');
      config.password = result.password;
    }

    server = email.server.connect({
      user: config.email,
      password: config.password,
      host: "smtp.gmail.com",
      ssl: true
    });

    console.log(util.now(), 'Setup email adviser.');
    callback();
  }

  if(!config.password) {
    // ask for the mail password
    var prompt = require('prompt-lite');
    prompt.start();
    console.log('You configured Gekko to mail you advice, Gekko needs your email password to send emails (to you).');
    console.log([
      'Gekko is an opensource project < http://github.com/askmike/gekko >, ', 
      'you can take my word but always check the code yourself.',
      '\n\n\tWARNING: If you have not downloaded Gekko from the github page above we\n',
      '\tCANNOT garantuee that your email address & password are safe!\n'
    ].join(''));
    prompt.get({name: 'password', hidden: true}, setupMail);
  } else {
    setupMail(false, false);
  }
}

var send = function(err) {
  if(err)
    console.log(util.now(), 'ERROR SENDING MAIL', err);
  else
    console.log(util.now(), 'Send advice via email.');
}

module.exports.send = function(what, price, meta) {
  if(what !== 'BUY' && what !== 'SELL')
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