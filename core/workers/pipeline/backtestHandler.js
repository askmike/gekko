module.exports = done => {
  var trades = [];
  var candles = [];
  var report = false;

  return {
    message: message => {

      if(message.type === 'candle')
        candles.push(message.candle);

      else if(message.type === 'trade')
        trades.push(message.trade);

      else if(message.type === 'report')
        report = message.report;

      else if(message.type === 'log')
        console.log(message.log);
    },
    exit: status => {
      if(status !== 0)
        done('Child process has died.');
      else
        done(null, {
          trades: trades,
          candles: candles,
          report: report
        });
    }
  }
}