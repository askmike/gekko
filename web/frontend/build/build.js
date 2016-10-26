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
        width = window.innerWidth - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    var x = techan.scale.financetime().range([0, width]);

    var y = d3.scaleLinear().range([height, 0]);

    var zoom = d3.zoom().on("zoom", zoomed);

    var zoomableInit;

    var candlestick = techan.plot.candlestick().xScale(x).yScale(y);

    var tradearrow = techan.plot.tradearrow().xScale(x).yScale(y).orient(function (d) {
        return d.action.startsWith("buy") ? "up" : "down";
    }).on("mouseenter", enter).on("mouseout", out);

    var xAxis = d3.axisBottom(x);

    var yAxis = d3.axisLeft(y);

    var svg = d3.select("body").append("svg").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var valueText = svg.append('text').style("text-anchor", "end").attr("class", "coords").attr("x", width - 5).attr("y", 15);

    svg.append("clipPath").attr("id", "clip").append("rect").attr("x", 0).attr("y", y(1)).attr("width", width).attr("height", y(0) - y(1));

    svg.append("g").attr("class", "candlestick").attr("clip-path", "url(#clip)");

    svg.append("g").attr("class", "tradearrow");

    svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + height + ")");

    svg.append("g").attr("class", "y axis").append("text").attr("transform", "rotate(-90)").attr("y", 6).attr("dy", ".71em").style("text-anchor", "end").text("Price ($)");

    svg.append("rect").attr("class", "pane").attr("width", width).attr("height", height).call(zoom);

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

    x.domain(data.map(accessor.d));
    y.domain(techan.scale.plot.ohlc(data, accessor).domain());

    svg.select("g.candlestick").datum(data);
    draw();

    // Associate the zoom with the scale after a domain has been applied
    // Stash initial settings to store as baseline for zooming
    zoomableInit = x.zoomable().clamp(false).copy();

    function zoomed() {
        var rescaledY = d3.event.transform.rescaleY(y);
        yAxis.scale(rescaledY);
        candlestick.yScale(rescaledY);
        tradearrow.yScale(rescaledY);

        // Emulates D3 behaviour, required for financetime due to secondary zoomable scale
        x.zoomable().domain(d3.event.transform.rescaleX(zoomableInit).domain());

        draw();
    }

    function draw() {
        svg.select("g.candlestick").call(candlestick);
        // using refresh method is more efficient as it does not perform any data joins
        // Use this if underlying data is not changing
        // svg.select("g.candlestick").call(candlestick.refresh);
        svg.selectAll("g.tradearrow").datum(trades).call(tradearrow);

        svg.select("g.x.axis").call(xAxis);
        svg.select("g.y.axis").call(yAxis);
    }

    function enter(d) {
        valueText.style("display", "inline");
        refreshText(d);
    }

    function out() {
        valueText.style("display", "none");
    }

    function refreshText(d) {
        valueText.text("Trade: " + dateFormat(d.date) + ", " + d.type + ", " + d.price.toFixed(12));
    }

    trades = _.map(trades, function (t) {
        t.date = moment(t.date).toDate();
        t.type = t.action;
        t.quantity = t.balance;
        return t;
    });

    draw(data, trades);

    // //////////
    // //////////
    // //////////
    // //////////
    // //////////
    // //////////
    // //////////
    // //////////
    // //////////
    // //////////
    // //////////
    // //////////
    // //////////
    // //////////


    // var accessor = candlestick.accessor();

    // data = data.map(function(d) {
    //     return {
    //         date: moment(d.start).toDate(),
    //         open: +d.open,
    //         high: +d.high,
    //         low: +d.low,
    //         close: +d.close,
    //         volume: +d.volume
    //     };
    // }).sort(function(a, b) { return d3.ascending(accessor.d(a), accessor.d(b)); });

    // var trades = [
    //     { date: data[67].date, type: "buy", price: data[67].low, quantity: 1000 },
    //     { date: data[100].date, type: "sell", price: data[100].high, quantity: 200 },
    //     { date: data[156].date, type: "buy", price: data[156].open, quantity: 500 },
    //     { date: data[167].date, type: "sell", price: data[167].close, quantity: 300 },
    //     { date: data[187].date, type: "buy-pending", price: data[187].low, quantity: 300 }
    // ];

    // svg.append("g")
    //         .attr("class", "candlestick");

    // svg.append("g")
    //         .attr("class", "tradearrow");

    // svg.append("g")
    //         .attr("class", "x axis")
    //         .attr("transform", "translate(0," + height + ")");

    // svg.append("g")
    //         .attr("class", "y axis")
    //         .append("text")
    //         .attr("transform", "rotate(-90)")
    //         .attr("y", 6)
    //         .attr("dy", ".71em")
    //         .style("text-anchor", "end")
    //         .text("Price (" + $('#currency').val()  + ")");

    // draw(data, trades);

    // function draw(data, trades) {

    //     console.log(trades);

    //     x.domain(data.map(candlestick.accessor().d));
    //     y.domain(techan.scale.plot.ohlc(data, candlestick.accessor()).domain());

    //     svg.selectAll("g.candlestick").datum(data).call(candlestick);

    //     svg.selectAll("g.tradearrow").datum(trades).call(tradearrow);

    //     svg.selectAll("g.x.axis").call(xAxis);
    //     svg.selectAll("g.y.axis").call(yAxis);
    // }

};

},{}],3:[function(require,module,exports){
var config = {};

// Exponential Moving Averages settings:
config.DEMA = {
  // EMA weight (α)
  // the higher the weight, the more smooth (and delayed) the line
  short: 10,
  long: 21,
  // amount of candles to remember and base initial EMAs on
  // the difference between the EMAs (to act as triggers)
  thresholds: {
    down: -0.025,
    up: 0.025
  }
};

// MACD settings:
config.MACD = {
  // EMA weight (α)
  // the higher the weight, the more smooth (and delayed) the line
  short: 10,
  long: 21,
  signal: 9,
  // the difference between the EMAs (to act as triggers)
  thresholds: {
    down: -2.2,
    up: 2.2,
    // How many candle intervals should a trend persist
    // before we consider it real?
    persistence: 1
  }
};

// PPO settings:
config.PPO = {
  // EMA weight (α)
  // the higher the weight, the more smooth (and delayed) the line
  short: 12,
  long: 26,
  signal: 9,
  // the difference between the EMAs (to act as triggers)
  thresholds: {
    down: -0.025,
    up: 0.025,
    // How many candle intervals should a trend persist
    // before we consider it real?
    persistence: 2
  }
};

// Uses one of the momentum indicators but adjusts the thresholds when PPO is bullish or bearish
// Uses settings from the ppo and momentum indicator config block
config.varPPO = {
  momentum: 'TSI', // RSI, TSI or UO
  thresholds: {
    // new threshold is default threshold + PPOhist * PPOweight
    weightLow: 120,
    weightHigh: -120,
    // How many candle intervals should a trend persist
    // before we consider it real?
    persistence: 0
  }
};

// RSI settings:
config.RSI = {
  interval: 14,
  thresholds: {
    low: 30,
    high: 70,
    // How many candle intervals should a trend persist
    // before we consider it real?
    persistence: 1
  }
};

// TSI settings:
config.TSI = {
  short: 13,
  long: 25,
  thresholds: {
    low: -25,
    high: 25,
    // How many candle intervals should a trend persist
    // before we consider it real?
    persistence: 1
  }
};

// Ultimate Oscillator Settings
config.UO = {
  first: { weight: 4, period: 7 },
  second: { weight: 2, period: 14 },
  third: { weight: 1, period: 28 },
  thresholds: {
    low: 30,
    high: 70,
    // How many candle intervals should a trend persist
    // before we consider it real?
    persistence: 1
  }
};

// CCI Settings
config.CCI = {
  constant: 0.015, // constant multiplier. 0.015 gets to around 70% fit
  history: 90, // history size, make same or smaller than history
  thresholds: {
    up: 100, // fixed values for overbuy upward trajectory
    down: -100, // fixed value for downward trajectory
    persistence: 0 // filter spikes by adding extra filters candles
  }
};

// StochRSI settings
config.StochRSI = {
  interval: 3,
  thresholds: {
    low: 20,
    high: 80,
    // How many candle intervals should a trend persist
    // before we consider it real?
    persistence: 3
  }
};

// custom settings:
config.custom = {
  my_custom_setting: 10
};

config['talib-macd'] = {
  parameters: {
    optInFastPeriod: 10,
    optInSlowPeriod: 21,
    optInSignalPeriod: 9
  },
  thresholds: {
    down: -0.025,
    up: 0.025
  }
};

module.exports = config;

},{}],4:[function(require,module,exports){
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
    post('/api/backtest', function (data) {
      console.log(data);
      $('#log').text('done!');
      chart(data.candles, data.trades);
    }, request);
  };

  $('#log').text('checking available data.');
  post('/api/scan', handle, request);
};

},{"./ajax":1,"./chart":2,"./indicatorSettings":3}]},{},[4])


//# sourceMappingURL=build.js.map
