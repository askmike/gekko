var MtGoxClient = require("mtgox-apiv2");
var util = require('../util.js');

var trader = function(key, secret) {
  this.key = key;
  this.secret = secret;
  this.name = 'Mt. Gox';

  this.mtgox = new MtGoxClient(this.key, this.secret);
}

trader.prototype.trade = function(what) {
  if(what !== 'BUY' && what !== 'SELL')
    return;

  console.log(util.now(), 'NOW going to', what, '@', this.name);
  if(what === 'BUY')
    this.mtgox.add('bid', 1000);
  if(what === 'SELL')
    this.mtgox.add('ask', 1000);
}

module.exports = trader;