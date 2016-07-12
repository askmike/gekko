var ws = new WebSocket(`ws://${location.hostname}:${location.port}/`);

var page = location.pathname;

var messageHandlers = {};

ws.onmessage = e => {
  var data = JSON.parse(e.data);

  if(messageHandlers[data.type])
    messageHandlers[data.type](data.message);
  else
    console.log(data);
}


if(true) {
  var $log = document.getElementById('log');

  var $backtest = document.getElementById('backtest');

  messageHandlers.log = m => $log.innerHTML += m + '\n';

  $backtest.onclick = () => {

    console.log('go');

    $log.innerHTML = '';

    var request = {
      watch: {
        exchange: 'bitstamp',
        currency: 'USD',
        asset: 'BTC'
      },
      backtest: {
        daterange: 'scan'
      }
    };

    ajax('/api/backtest', _.noop, 'data=' + JSON.stringify(request));

  }
}

