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



var daterange = false;

if(true) {
  var $log = document.getElementById('log');

  

  messageHandlers.log = m => {
    $log.innerHTML += m.join('\n') + '\n'
    $log.scrollTop = $log.scrollHeight;
  };

  var $backtest = document.getElementById('backtest');
  $backtest.onclick = () => {
    var request = {
      watch: {
        exchange: 'poloniex',//prompt('What exchange?'),
        currency: 'USDT', //prompt('What currency?'),
        asset: 'BTC'//prompt('What Asset?')
      }
    }

    var handle = data => {
      var ranges = JSON.parse(data);
      // if(_.size(ranges) === 1) {
      //   daterange = _.first(ranges);
      // }

      var fmt = u => moment.unix(u).format('YYYY-MM-DD HH:mm:ss');

      var q = 'what range would you like?\n';
      _.each(ranges, (r, i) => {
        q += 'OPTION ' + (i + 1) + '\n';
        q += '\tfrom ' + fmt(r.from) + '\n';
        q += '\tto ' + fmt(r.to) + '\n';
      });

      var index = parseInt(prompt(q)) - 1;
      
      daterange = ranges[index];

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


    ajax('/api/scan', handle, 'data=' + JSON.stringify(request));
  }
}

