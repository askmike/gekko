var email   = require("emailjs");
var moment = require('moment');
var server, config;

module.exports.init = function(c) {
  config = c;
  server = email.server.connect({
    user: config.email, 
    password: config.password, 
    host: "smtp.gmail.com", 
    ssl: true
  });
}

var send = function(err) {
  if(err)
    console.log('ERROR SENDING MAIL', err);
  else
    console.log('send advice via email');
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