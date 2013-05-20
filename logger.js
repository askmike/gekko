var util = require('./util.js');

// log advice to stdout
module.exports.inform = function(what, price, meta) {
  console.log('(ADVICE)', util.now(), what, meta);
}


// after every succesfull trend ride we end up with more BTC than we started with, 
// this function calculates Gekko's profit in %.

// virtual balance
var start = {
  btc: 1,
  usd: 100,
  balance: false
}
var current = {
  btc: start.btc,
  usd: start.usd,
  balance: false
}
var trades = 0;
module.exports.trackProfits = function(what, price, meta) {
  // first time calculate the virtual account balance
  if(!start.balance)
    start.balance = price * start.btc + start.usd;

  // virtually trade all USD to BTC at the current MtGox price
  if(what === 'BUY') {
    current.btc += current.usd / price;
    current.usd = 0;
    trades++;
  }

  // virtually trade all BTC to USD at the current MtGox price
  if(what === 'SELL') {
    current.usd += current.btc * price;
    current.btc = 0;
    trades++;
  }

  current.balance = price * current.btc + current.usd;
  var profit = current.balance / start.balance * 100 - 100;

  console.log(
    '(PROFIT REPORT)',
    util.now(),
    profit.toFixed(3) + '% profit',
    '(in ' + trades + ' trades)'
  );
}