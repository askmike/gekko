(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var _this = this;

// https://gist.github.com/Xeoncross/7663273

module.exports.get = (url, callback, x) => {
  try {
    x = new (_this.XMLHttpRequest || ActiveXObject)('MSXML2.XMLHTTP.3.0');
    x.open('GET', url, 1);
    x.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    x.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    x.onreadystatechange = function () {
      x.readyState > 3 && callback && callback(x.responseText, x);
    };
    x.send(data);
  } catch (e) {
    window.console && console.log(e);
  }
};

module.exports.post = (url, callback, data, x) => {
  var xhr = new XMLHttpRequest();
  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-type", "application/json");
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4 && xhr.status == 200) {
      var json = JSON.parse(xhr.responseText);
      callback(json);
    }
  };
  var data = JSON.stringify(data);
  xhr.send(data);
};

// https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
// https://gist.github.com/jed/993585
// https://gist.github.com/Fluidbyte/5082377
// https://github.com/Xeoncross/kb_javascript_framework/blob/master/kB.js#L30
// https://gist.github.com/iwek/5599777
// http://msdn.microsoft.com/en-us/library/ms537505(v=vs.85).aspx#_id

// @todo look into lengthComputable for xhr.upload browsers
// http://stackoverflow.com/questions/11127654/why-is-progressevent-lengthcomputable-false
// http://stackoverflow.com/questions/10956574/why-might-xmlhttprequest-progressevent-lengthcomputable-be-false
// https://github.com/ForbesLindesay/ajax/blob/master/index.js

},{}],2:[function(require,module,exports){
module.exports = function (data, trades) {

        var margin = { top: 20, right: 20, bottom: 30, left: 50 },
            width = 960 - margin.left - margin.right,
            height = 500 - margin.top - margin.bottom;

        var dateFormat = d3.timeFormat("%d-%b-%y"),
            parseDate = d3.timeParse("%Y-%m-%dT%H:%M:%SZ"),
            //"%d-%b-%y"),
        valueFormat = d3.format(',.2f');

        var x = techan.scale.financetime().range([0, width]);

        var y = d3.scaleLinear().range([height, 0]);

        var candlestick = techan.plot.candlestick().xScale(x).yScale(y);

        var tradearrow = techan.plot.tradearrow().xScale(x).yScale(y).orient(function (d) {
                return d.action.startsWith("buy") ? "up" : "down";
        }).on("mouseenter", enter).on("mouseout", out);

        var xAxis = d3.axisBottom(x);

        var yAxis = d3.axisLeft(y);

        var svg = d3.select("body").append("svg").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var valueText = svg.append('text').style("text-anchor", "end").attr("class", "coords").attr("x", width - 5).attr("y", 15);

        var accessor = candlestick.accessor();

        data = data.map(function (d) {
                return {
                        date: moment(d.start).toDate(),
                        open: +d.open,
                        high: +d.high,
                        low: +d.low,
                        close: +d.close,
                        volume: +d.volume
                };
        }).sort(function (a, b) {
                return d3.ascending(accessor.d(a), accessor.d(b));
        });

        // var trades = [
        //     { date: data[67].date, type: "buy", price: data[67].low, quantity: 1000 },
        //     { date: data[100].date, type: "sell", price: data[100].high, quantity: 200 },
        //     { date: data[156].date, type: "buy", price: data[156].open, quantity: 500 },
        //     { date: data[167].date, type: "sell", price: data[167].close, quantity: 300 },
        //     { date: data[187].date, type: "buy-pending", price: data[187].low, quantity: 300 }
        // ];

        svg.append("g").attr("class", "candlestick");

        svg.append("g").attr("class", "tradearrow");

        svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + height + ")");

        svg.append("g").attr("class", "y axis").append("text").attr("transform", "rotate(-90)").attr("y", 6).attr("dy", ".71em").style("text-anchor", "end").text("Price (" + $('#currency').val() + ")");

        // Data to display initially
        // draw(data.slice(0, data.length-20), trades.slice(0, trades.length-1));
        draw(data, trades);
        // Only want this button to be active if the data has loaded
        // d3.select("button").on("click", function() { draw(data, trades); }).style("display", "inline");

        function draw(data, trades) {
                trades = _.map(trades, function (t) {
                        t.date = moment(t.date).toDate();
                        t.type = t.action;
                        t.quantity = t.balance;
                        return t;
                });
                console.log(trades);

                x.domain(data.map(candlestick.accessor().d));
                y.domain(techan.scale.plot.ohlc(data, candlestick.accessor()).domain());

                svg.selectAll("g.candlestick").datum(data).call(candlestick);

                svg.selectAll("g.tradearrow").datum(trades).call(tradearrow);

                svg.selectAll("g.x.axis").call(xAxis);
                svg.selectAll("g.y.axis").call(yAxis);
        }

        function enter(d) {
                valueText.style("display", "inline");
                refreshText(d);
        }

        function out() {
                valueText.style("display", "none");
        }

        function refreshText(d) {
                valueText.text("Trade: " + dateFormat(d.date) + ", " + d.type + ", " + valueFormat(d.price));
        }
};

},{}],3:[function(require,module,exports){
var post = require('./ajax').post;
var chart = require('./chart');
// todo!
// var exchages = require('../../../exchanges');

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
  };

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
    };

    var request = {
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
    };

    $('#log').text('running backtest');
    console.log('backtesting...', request);
    post('/api/backtest', function (data) {
      console.log(data);
      $('#log').text('done!');
      chart(data.candles, data.trades);
    }, request);
  };

  $('#log').text('checking available data.');
  post('/api/scan', handle, request);
};

},{"./ajax":1,"./chart":2}]},{},[3])


//# sourceMappingURL=build.js.map
