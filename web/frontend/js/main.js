var post = require('./ajax').post;
var chart = require('./chart');
// todo!
// var exchages = require('../../../exchanges');
var indicatorSettings = require('./indicatorSettings');

var fmt = u => moment.unix(u).utc().format('YYYY-MM-DD HH:mm:ss');

var $backtest = document.getElementById('backtest');
$backtest.onclick = () => {
  $('svg').remove();

  var request = {
    watch: {
      exchange: $('#exchange').val(),
      currency: $('#currency').val(),
      asset: $('#asset').val()
    }
  }

  var handle = ranges => {
    // var ranges = JSON.parse(data);
    // if(_.size(ranges) === 1) {
    //   daterange = _.first(ranges);
    // }

    var q = 'what range would you like?\n';
    _.each(ranges, (r, i) => {
      q += 'OPTION ' + (i + 1) + '\n';
      q += '\tfrom ' + fmt(r.from) + '\n';
      q += '\tto ' + fmt(r.to) + '\n';
    });

    var index = parseInt(prompt(q)) - 1;
    
    var daterange = {
      from: fmt(ranges[index].from),
      to: fmt(ranges[index].to)
    }

    var request = _.merge({
      tradingAdvisor: {
        enabled: true,
        method: $('#strat').val(),
        candleSize: +$('#candleSize').val(),
        historySize: +$('#historySize').val(),
        talib: {
          enabled: $('#talib').val() === 'true',
          version: '1.0.2'
        }
      },
      watch: {
        exchange: $('#exchange').val(),
        currency: $('#currency').val(),
        asset: $('#asset').val()
      },
      backtest: {
        daterange: daterange
      }
    }, indicatorSettings);

    $('#log').text('running backtest');
    console.log('backtesting...', request);
    post('/api/backtest', function(data) {
      console.log(data);
      $('#log').text('done!');
      chart(data.candles, data.trades);
    }, request);

  }

  $('#log').text('checking available data.');
  post('/api/scan', handle, request);
}

