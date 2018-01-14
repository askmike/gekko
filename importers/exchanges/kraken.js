var KrakenClient = require('kraken-api-es5')
var _ = require('lodash');
var moment = require('moment');

var util = require('../../core/util.js');
var log = require('../../core/log');
var Errors = require('../../core/error.js')

var config = util.getConfig();

var dirs = util.dirs();

var Fetcher = require(dirs.exchanges + 'kraken');

util.makeEventEmitter(Fetcher);

var end = false;
var done = false;
var from = false;

var lastId = false;
var prevLastId = false;

var fetcher = new Fetcher(config.watch);

var fetch = () => {
    fetcher.import = true;

    if (lastId) {
        var tidAsTimestamp = lastId / 1000000;
        setTimeout(() => {
            fetcher.getTrades(tidAsTimestamp, handleFetch)
        }, 500);
    }
    else
        fetcher.getTrades(from, handleFetch);
}

var handleFetch = (err, trades) => {
    if (err) {
        log.error(`There was an error importing from Kraken ${err}`);
        fetcher.emit('done');
        return fetcher.emit('trades', []);
    }

    var last = moment.unix(_.last(trades).date);
    lastId = _.last(trades).tid

    if(last < from) {
        log.debug('Skipping data, they are before from date', last.format());
        return fetch();
    }

    if  (last > end || lastId === prevLastId) {
        fetcher.emit('done');

        var endUnix = end.unix();
        trades = _.filter(
            trades,
            t => t.date <= endUnix
        )
    }

    prevLastId = lastId
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


