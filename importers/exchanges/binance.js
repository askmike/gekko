const moment = require('moment');
const util = require('../../core/util.js');
const _ = require('lodash');
const log = require('../../core/log');

var config = util.getConfig();
var dirs = util.dirs();

var Fetcher = require(dirs.exchanges + 'binance');

util.makeEventEmitter(Fetcher);

var end = false;
var done = false;
var from = false;

var fetcher = new Fetcher(config.watch);

var fetch = () => {
  fetcher.import = true;
  fetcher.getTrades(from, handleFetch);
};

var handleFetch = (unk, trades) => {
  if (trades.length > 0) {
    var last = moment.unix(_.last(trades).date);

    if (last < from) {
      log.debug(
        'Skipping data, they are before from date (probably a programming error)',
        last.format()
      );
      return fetch();
    }
  }

  var next = from.add(1, 'd');
  if (next >= end) {
    fetcher.emit('done');

    var endUnix = end.unix();
    trades = _.filter(trades, t => t.date <= endUnix);
  }

  from = next.clone();
  fetcher.emit('trades', trades);
};

module.exports = function(daterange) {
  from = daterange.from.clone();
  end = daterange.to.clone();

  return {
    bus: fetcher,
    fetch: fetch,
  };
};
