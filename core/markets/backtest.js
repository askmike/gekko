var _ = require('lodash');
var util = require('../util');
var config = util.getConfig();
var dirs = util.dirs();
var log = require(dirs.core + 'log');
var moment = require('moment');

var adapter = config.adapters[config.backtest.adapter];
var Reader = require(dirs.gekko + adapter.path + '/reader');
var daterange = config.backtest.daterange;

var to = moment.utc(daterange.to);
var from = moment.utc(daterange.from);

if(to <= from)
  util.die('This daterange does not make sense.')

var Market = function() {
  _.bindAll(this);
  this.pushing = false;
  this.ended = false;

  Readable.call(this, {objectMode: true});

  console.log('');
  log.info('\tWARNING: BACKTESTING FEATURE NEEDS PROPER TESTING');
  log.info('\tWARNING: ACT ON THESE NUMBERS AT YOUR OWN RISK!');
  console.log('');

  this.reader = new Reader();
  this.batchSize = config.backtest.batchSize;
  this.iterator = {
    from: from.clone(),
    to: from.clone().add(this.batchSize, 'm').subtract(1, 's')
  }
}

var Readable = require('stream').Readable;
Market.prototype = Object.create(Readable.prototype, {
  constructor: { value: Market }
});

Market.prototype._read = function() {
  if(this.pushing)
    return;

  this.get();
}

Market.prototype.get = function() {
  if(this.iterator.to >= to) {
    this.iterator.to = to;
    this.ended = true;
  }

  this.reader.get(
    this.iterator.from.unix(),
    this.iterator.to.unix(),
    'full',
    this.processCandles
  )
}

Market.prototype.processCandles = function(err, candles) {
  this.pushing = true;
  var amount = _.size(candles);

  if(amount === 0)
    util.die('Query returned no candles (do you have local data for the specified range?)');

  if(!this.ended && amount < this.batchSize) {
    var d = function(ts) {
      return moment.unix(ts).utc().format('YYYY-MM-DD HH:mm:ss');
    }
    var from = d(_.first(candles).start);
    var to = d(_.last(candles).start);
    log.warn(`Simulation based on incomplete market data (${this.batchSize - amount} missing between ${from} and ${to}).`);
  }

  _.each(candles, function(c, i) {
    c.start = moment.unix(c.start);

    if(++i === amount) {
      // last one candle from batch
      if(!this.ended)
        this.pushing = false;
      else {
        _.defer(function() {
          this.reader.close();
          this.emit('end');
        }.bind(this));
      }
    }

    this.push(c);

  }, this);

  this.iterator = {
    from: this.iterator.from.clone().add(this.batchSize, 'm'),
    to: this.iterator.from.clone().add(this.batchSize * 2, 'm').subtract(1, 's')
  }
}

module.exports = Market;