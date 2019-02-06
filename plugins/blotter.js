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
  this.tradeError = false;
  this.inaccurateData = false;

  this.done = done;
  this.setup();
};

Blotter.prototype.setup = function(done) {

  this.headertxt = "Date,Price,Amount,Side,Fees,Value,P&L,Notes\n";

  fsw.readFile(this.filename, (err, _) => {
    if (err) {
      log.warn('No file with the name', this.filename, 'found. Creating new blotter file');
      fsw.appendFile(this.filename, this.headertxt, 'utf8', (err) => {
        if(err) {
          log.error('Unable to write header text to blotter');
        }
      });
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
  // If a trade date is from 1969 or 1970, there was an error with the trade
  if (trade.date.format('YY') == '69' || trade.date.format('YY') == '70') {
    log.error('Received 1969/1970 error, trade failed to execute, did not record in blotter');
    // Prevent roundTrip from writing error P&L in processRoundtrip method
    if (trade.action == 'sell') {
      this.tradeError = true;
    }
    return;
  }

  this.valueAtBuy = this.roundUp(trade.effectivePrice * trade.amount);

  if (trade.action === 'buy') {
    //time, price, amount, side, fees, value at buy
    this.outtxt = this.time + "," + trade.effectivePrice.toFixed(2) + "," + trade.amount.toFixed(8) + "," + trade.action + "," + trade.feePercent + "," + this.valueAtBuy;
    if ((trade.price == 0 || isNaN(trade.price)) && (trade.amount == 0|| isNaN(trade.amount))) {
      this.outtxt = this.outtxt + "," + ",Trade probably went through but didn't receive correct price/amount info\n";
    } else {
      this.outtxt = this.outtxt  + "\n";
    }
    this.writeBlotter();
    return;
  }
  else if (trade.action === 'sell'){
    var sellValue = (this.roundUp(trade.effectivePrice * trade.amount));
    //time, price, amount, side, fees, value at sell
    this.outtxt = this.time + "," + trade.effectivePrice.toFixed(2) + "," + trade.amount.toFixed(8) + "," + trade.action + "," + trade.feePercent + "," + sellValue + ",";
    if ((trade.price == 0 || isNaN(trade.price)) && (trade.amount == 0|| isNaN(trade.amount))) {
      this.inaccurateData = true;
    }
    this.valueAtBuy = 0.0;
    // wait til processRoundtrip complete to write to file
  }

}

Blotter.prototype.writeBlotter = function() {
  fsw.appendFile(this.filename, this.outtxt, 'utf8', (err) => {
    if(err) {
      log.error('Unable to write trade to blotter');
    }
  });
}

Blotter.prototype.processRoundtrip = function(trip) {
  log.info('Roundtrip', trip);
  if (!this.tradeError) {
    this.outtxt = this.outtxt + this.roundUp(trip.pnl) +'\n';
    this.writeBlotter();
    return;
  }
  if (this.inaccurateData) {
    this.outtxt = this.outtxt + this.roundUp(trip.pnl) + ",Trade probably went through but didn't receive correct price/amount info\n";
    this.inaccurateData = false;
    this.writeBlotter;
    return;
  }

  // 1969/1970 sell trade error not written to blotter, resetting flag to false 
  this.tradeError = false;
}

Blotter.prototype.roundUp = function(value) {
  var cents = value * 100; 
  var roundedCents = Math.round(cents); 
  return roundedCents / 100; 
}

module.exports = Blotter;
