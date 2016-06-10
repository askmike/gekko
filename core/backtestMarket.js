var _ = require('lodash');
var util = require('./util');
var config = util.getConfig();
var dirs = util.dirs();
var log = require('./log');
var moment = require('moment');

var Reader = require(dirs.gekko + config.adapter.path);

var daterange = config.backtest.daterange;

var Market = function() {
  _.bindAll(this);

  this.pushing = false;
  this.ended = false;

  Readable.call(this, {objectMode: true});

  log.info('Going to backtest');
  log.info('\tfrom:', daterange.from.format('YYYY-MM-DD HH:mm:ss'));
  log.info('\tto:', daterange.to.format('YYYY-MM-DD HH:mm:ss'));
  log.info(
    '\ttimespan:',
    moment.duration(
      daterange.from.diff(daterange.to)
    ).humanize()
  );

  this.reader = new Reader();
  this.batchSize = config.backtest.batchSize;
  this.iterator = {
    from: daterange.from,
    to: daterange.from.clone().add(this.batchSize, 'm').subtract(1, 's')
  }
}

var Readable = require('stream').Readable;
Market.prototype = Object.create(Readable.prototype, {
  constructor: { value: Market }
});

Market.prototype._read = function noop() {
  // console.log('READ', !this.pushing);
  if(this.pushing)
    return;

  this.get();
}

Market.prototype.start = function() {
  return this;
}

Market.prototype.get = function() {
  // console.log('GET CALL')
  // console.log('ITERATOR TO', this.iterator.to.format('YYYY-MM-DD HH:mm:ss'));
  // console.log('DATERANGE TO', daterange.to.format('YYYY-MM-DD HH:mm:ss'));
  if(this.iterator.to >= daterange.to) {
    this.iterator.to = daterange.to;
    this.ended = true;
  }

  this.reader.get(
    this.iterator.from.unix(),
    this.iterator.to.unix(),
    this.processCandles
  )
}

Market.prototype.processCandles = function(candles) {
  this.pushing = true;
  var amount = _.size(candles);
  _.each(candles, function(c, i) {
    c.start = moment.unix(c.start);

    if(++i === amount) {
      // last one candle from batch
      if(!this.ended)
        this.pushing = false;
      else {
        _.defer(function() {
          console.log('emit done')
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