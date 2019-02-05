const fsw = require('fs');
const _ = require('lodash');
const log = require('../core/log.js');
const util = require('../core/util.js');
const config = util.getConfig();
const blotterConfig = config.blotter;

var Blotter = function(done) {
  _.bindAll(this);

  this.time;
  this.valueAtBuy = 0.0;
  this.filename = blotterConfig.filename;
  this.dateformat = blotterConfig.dateFormat;
  this.timezone = blotterConfig.timezone;
  this.headertxt = '';
  this.outtxt = '';

  this.done = done;
  this.setup();
};

Blotter.prototype.setup = function(done) {

  this.headertxt = "Date,Price,Amount,Side,Fees,Value,P&L,Notes\n";

  fsw.readFile(this.filename, (err, _) => {
    if (err) {
      log.warn('No file with the name', this.filename, 'found. Creating new blotter file');
      fsw.appendFileSync(this.filename, this.headertxt, encoding='utf8'); 
    } 
  });

};

Blotter.prototype.processTradeCompleted = function(trade) {
  // if exchange doesn't send correct timezone, correct it
  if (trade.date.format('Z') == '+00:00') {
    var adjustTimezone = trade.date.utcOffset(this.timezone);
    this.time = adjustTimezone.format(this.dateformat);
  } else {
    this.time = trade.date.format(this.dateformat);
  }

  if (trade.action === 'buy') {
    this.valueAtBuy = this.roundUp(trade.effectivePrice * trade.amount);
    //time, price, amount, side, fees, value at buy
    this.outtxt = this.time + "," + trade.effectivePrice.toFixed(2) + "," + trade.amount.toFixed(8) + "," + trade.action + "," + trade.feePercent + "," + this.valueAtBuy;
  }
  else if (trade.action === 'sell'){
    var sellValue = (this.roundUp(trade.effectivePrice * trade.amount));
    var pl = this.roundUp(this.valueAtBuy - this.roundUp(trade.effectivePrice * trade.amount));
    log.info('Buy Value', this.valueAtBuy, 'Sell Value', sellValue, 'P&L', pl);
    //time, price, amount, side, fees, value at sell, P&L
    this.outtxt = this.time + "," + trade.effectivePrice.toFixed(2) + "," + trade.amount.toFixed(8) + "," + trade.action + "," + trade.feePercent + "," + sellValue + "," + pl;
    this.valueAtBuy = 0.0;
  }

  // If trade.price is 0 and trade amount is 0, note the error
  if (trade.price == 0 && trade.amount == 0 ) {
    // add extra comma for buy as it doesn't have P&L info
    if (trade.action === 'buy') {
      this.outtxt = this.outtxt + ",";
    }
    this.outtxt = this.outtxt + "," + "Trade probably went through but didn't receive correct price/amount info\n";
  } else {
    this.outtxt = this.outtxt  + "\n";
  }

  // If a trade date is from 1969 or 1970, there was an error with the trade
  if (trade.date.format('YY') == '69' || trade.date.format('YY') == '70') {
    log.error('Received 1969/1970 error, trade failed to execute, did not record in blotter');
  }
  else {
    fsw.appendFileSync(this.filename, this.outtxt, encoding='utf8');
  }
  this.outtxt = "";

}

Blotter.prototype.roundUp = function(value) {
  var cents = value * 100; 
  var roundedCents = Math.round(cents); 
  return roundedCents / 100; 
}

module.exports = Blotter;
