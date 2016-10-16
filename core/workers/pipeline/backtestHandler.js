var trades = [];
var report = false;

module.exports.message = function(message) {
  if(message.type === 'trade')
    trades.push({
      date: message.date,
      action: message.action,
      balance: message.balance
    })
  else if(message.type === 'report')
    report = message.report;
}

module.exports.exit = function(status, done) {
  if(status !== 0)
    // todo: upstream error
    return done(new Error('ERROR!'));

  done(null, {
    trades: trades,
    report: report
  });
}