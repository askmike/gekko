var post = require('./ajax').post;

var exchages = require('../../../exchanges');

console.log(exchages);

var page = location.pathname;

var $backtest = document.getElementById('backtest');
$backtest.onclick = () => {
  var request = {
    watch: {
      exchange: 'poloniex',//prompt('What exchange?'),
      currency: 'USDT', //prompt('What currency?'),
      asset: 'BTC'//prompt('What Asset?')
    }
  }

  var handle = ranges => {
    // var ranges = JSON.parse(data);
    // if(_.size(ranges) === 1) {
    //   daterange = _.first(ranges);
    // }

    var fmt = u => moment.unix(u).utc().format('YYYY-MM-DD HH:mm:ss');

    var q = 'what range would you like?\n';
    _.each(ranges, (r, i) => {
      q += 'OPTION ' + (i + 1) + '\n';
      q += '\tfrom ' + fmt(r.from) + '\n';
      q += '\tto ' + fmt(r.to) + '\n';
    });

    var index = parseInt(prompt(q)) - 1;

    // daterange = ranges[index];
    
    var daterange = {
      from: fmt(ranges[index].from),
      to: fmt(ranges[index].to)
    }

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
        candleSize: 100,
        historySize: 20
      },
      watch: {
        exchange: 'poloniex',
        currency: 'USDT',
        asset: 'BTC'
      },
      backtest: {
        daterange: daterange
      }
    };

    console.log('backtesting...');
    post('/api/backtest2', function(data) {
      console.log('received:', data);
    }, request)

  }


  post('/api/scan', handle, request);
}

