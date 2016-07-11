var ws = new WebSocket(`ws://${location.hostname}:${location.port}/`);

var $log = document.getElementById('log');

ws.onopen = () => {
  console.log('aaa');
}

ws.onmessage = e => {
  var data = JSON.parse(e.data);

  console.log(data);

  if(data.type === 'log') {
    $log.innerHTML += data.message + '\n';
    $log.scrollTop = $log.scrollHeight;
  }
}

var $backtest = document.getElementById('backtest');

$backtest.onclick = () => {

  $log.innerHTML = '';

  fetch('/api/backtest', {
    method: 'POST',
    body: {
      watch: {
        exchange: 'bitstamp',
        currency: 'USD',
        asset: 'BTC'
      },
      backtest: {
        daterange: 'scan'
      }
    }
  });

}

