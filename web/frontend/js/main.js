var ws = new WebSocket(`ws://${location.hostname}:${location.port}/`);

var page = location.pathname;

var messageHandlers = {};

ws.onmessage = e => {
  var data = JSON.parse(e.data);

  _.each(messageHandlers, (fn, type) => {
    if(data[type])
      messageHandlers[type](data[type]);
  });
}


if(true) {
  var $log = document.getElementById('log');

  var $backtest = document.getElementById('backtest');

  messageHandlers.log = m => {
    $log.innerHTML += m.join('\n') + '\n'
    $log.scrollTop = $log.scrollHeight;
  };

  $backtest.onclick = () => {

    console.log('go');

    $log.innerHTML = '';

    var request = {
      MACD: {
        short: 10,
        long: 21,
        signal: 9,
        thresholds: {
          down: -0.025,
          up: 0.025,
          persistence: 1
        }
      },
      tradingAdvisor: {
        enabled: true,
        method: 'MACD',
        candleSize: 1,
        historySize: 20
      },
      watch: {
        exchange: 'poloniex',
        currency: 'USDT',
        asset: 'BTC'
      },
      backtest: {
        daterange: {
          from: '2016-03-01 00:00:00',
          to: '2016-03-16 09:00:00'
        }
      }
    };

    ajax('/api/backtest', _.noop, 'data=' + JSON.stringify(request));

  }
}

