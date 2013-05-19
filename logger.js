var util = require('./util.js');

// log advice to stdout
module.exports.inform = function(what, price, meta) {
  console.log('(ADVICE)', util.now(), what, meta);
}

// gather results
// after every succesfull trend ride we end up with more BTC than we started with 

// this function calculates Gekko's profit in %.

// virtual balance
var currentBTC = 1;
var currentUSD = 100;
// start value in BTC
var startBalance = false;
var trades = 0;
module.exports.trackProfits = function(what, price, meta) {
  if(!startBalance)
    startBalance = currentUSD / price + currentBTC;

  // virtually trade all USD to BTC at the current MtGox price
  if(what === 'BUY') {
    // var fee = currentUSD / price * 0.006;
    var btc = currentUSD / price;
    currentBTC += currentUSD / price;
    currentUSD = 0;
    trades++;
  }

  // virtually trade all USD to BTC at the current MtGox price
  if(what === 'SELL') {
    currentUSD += currentBTC * price;
    currentBTC = 0;
    trades++;
  }

  // current value in BTC
  var currentBalance = currentUSD / price + currentBTC;
  var profit = currentBalance / startBalance * 100 - 100;

  console.log(
    '(PROFIT REPORT)',
    util.now(),
    profit.toFixed(3),
    '% profit',
    '(in ' + trades + ' trades)'
  );
}