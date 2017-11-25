var _ = require('lodash');
var util = require('../util');
var config = util.getConfig();
var dirs = util.dirs();
var log = require(dirs.core + 'log');
var moment = require('moment');
var cp = require(dirs.core + 'cp');

var adapter = config[config.adapter];
var daterange = config.importer.daterange;

var from = moment.utc(daterange.from);

if(daterange.to) {
  var to = moment.utc(daterange.to);
} else {
  var to = moment().utc();
  log.debug(
    'No end date specified for importing, setting to',
    to.format('YYYY-MM-DD HH:mm:ss')
  );
}

if(!from.isValid())
  util.die('invalid `from`');

if(!to.isValid())
  util.die('invalid `to`');

var TradeBatcher = require(dirs.budfox + 'tradeBatcher');
var CandleManager = require(dirs.budfox + 'candleManager');
var exchangeChecker = require(dirs.core + 'exchangeChecker');

var error = exchangeChecker.cantFetchFullHistory(config.watch);
if(error)
  util.die(error, true);

var fetcher = require(dirs.importers + config.watch.exchange);

if(to <= from)
  util.die('This daterange does not make sense.')

var Market = function() {
  _.bindAll(this);
  this.exchangeSettings = exchangeChecker.settings(config.watch);

  this.tradeBatcher = new TradeBatcher(this.exchangeSettings.tid);
  this.candleManager = new CandleManager;
  this.fetcher = fetcher({
    to: to,
    from: from
  });

  this.done = false;

  this.fetcher.bus.on(
    'trades',
    this.processTrades
  );

  this.fetcher.bus.on(
    'done',
    function() {
      this.done = true;
    }.bind(this)
  )

  this.tradeBatcher.on(
    'new batch',
    this.candleManager.processTrades
  );

  this.candleManager.on(
    'candles',
    this.pushCandles
  );  

  Readable.call(this, {objectMode: true});

  this.get();
}

var Readable = require('stream').Readable;
Market.prototype = Object.create(Readable.prototype, {
  constructor: { value: Market }
});

Market.prototype._read = _.noop;

Market.prototype.pushCandles = function(candles) {
  _.each(candles, this.push);
}

Market.prototype.get = function() {
  this.fetcher.fetch();
}

Market.prototype.processTrades = function(trades) {
  this.tradeBatcher.write(trades);

  if(this.done) {
    log.info('Done importing!');
    this.emit('end');
    return;
  }

  if(_.size(trades)) {
    let lastAtTS = _.last(trades).date;
    let lastAt = moment.unix(lastAtTS).utc().format();
    cp.update(lastAt);
  }

  setTimeout(this.get, 1000);
}

module.exports = Market;