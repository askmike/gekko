const moment = require('moment');
const util = require('../../core/util');
const log = require('../../core/log');
const _ = require('lodash');
const retry = require('../../exchange/exchangeUtils').retry;

const config = util.getConfig();
const dirs = util.dirs();
const Fetcher = require(dirs.exchanges + 'therocktrading');

Fetcher.prototype.getTrades = function(since, to, page, callback, descending) {
  const handle = (err, data) => {
    if (err) return callback(err);
    var trades = [];
    if (_.isArray(data.trades)) {
      trades = _.map(data.trades, function(trade) {
        return {
          tid: trade.id,
          price: trade.price,
          amount: trade.amount,
          date: moment.utc(trade.date).format('X')
        };
      });
    }

    callback(null, descending ? trades : trades.reverse());
  };

  if (moment.isMoment(since)) since = since.format();
  if (moment.isMoment(to)) to = to.format();

  let options = {
    before: to,
    after: since,
    page: page,
    order: "ASC",
    per_page: 200
  }
  const fetch = cb => this.therocktrading.trades(this.pair, options, this.processResponse('getTrades', cb));
  retry(null, fetch, handle);
};

util.makeEventEmitter(Fetcher);

var end = false;
var done = false;
var from = false;

var page = 1;

var fetcher = new Fetcher(config.watch);

var fetch = () => {
    fetcher.import = true;

    log.debug("IMPORTER: starting fetcher")

    fetcher.getTrades(from, end, page, handleFetch);
}

var handleFetch = (err, trades) => {
    if(!err && !trades.length) {
        console.log('no more trades');
        fetcher.emit('done');
    }

    if (err) {
        log.error(`There was an error importing from TheRockTrading ${err}`);
        fetcher.emit('done');
        return fetcher.emit('trades', []);
    }

    if (trades.length > 0) {
        page = page + 1;
    }

    fetcher.emit('trades', trades);
}

module.exports = function (daterange) {

    from = daterange.from.clone();
    end = daterange.to.clone();

    return {
        bus: fetcher,
        fetch: fetch
    }
}


