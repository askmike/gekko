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
    },
    exit: status => {
      if(status !== 0)
        // todo: upstream error
        return done(new Error('ERROR!'));

      done(null, {
        trades: trades,
        candles: candles,
        report: report
      });
    }
  }
}