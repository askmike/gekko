const moment = require('moment');
const util = require('../../core/util.js');
const _ = require('lodash');
const log = require('../../core/log');

var config = util.getConfig();
var dirs = util.dirs();

var Fetcher = require(dirs.exchanges + 'coinfalcon');

util.makeEventEmitter(Fetcher);

var end = false;
var done = false;
var from = false;

var fetcher = new Fetcher(config.watch);

var fetch = () => {
  fetcher.import = true;
  log.debug('[CoinFalcon] Getting trades from: ', from);
  fetcher.getTrades(from, handleFetch);
};

var handleFetch = (unk, trades) => {
  if (trades.length > 0) {
    var last = moment.unix(_.last(trades).date).utc();
    var next = last.clone();
  } else {
    var next = from.clone().add(1, 'h');
    log.debug('Import step returned no results, moving to the next 1h period');
  }

  if (from.add(1, 'h') >= end) {
    fetcher.emit('done');

    var endUnix = end.unix();
    trades = _.filter(trades, t => t.date <= endUnix);
  }

  from = next.clone();
  fetcher.emit('trades', trades);
};

module.exports = function(daterange) {
  from = daterange.from.clone().utc();
  end = daterange.to.clone().utc();

  return {
    bus: fetcher,
    fetch: fetch,
  };
};
