// Relay the backtest message it when it comes in.

module.exports = done => {
  let backtest;

  return {
    message: message => {
      if(message.backtest) {
        done(null, message.backtest);
      }
    },
    exit: status => {
      if(status !== 0) {
        if(backtest)
          console.error('Child process died after finishing backtest');
        else
          done('Child process has died.');
      }
    }
  }
}