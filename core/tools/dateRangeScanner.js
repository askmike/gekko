var BATCH_SIZE = 60; // minutes
var MISSING_CANDLES_ALLOWED = 3; // minutes, per batch

var _ = require('lodash');
var moment = require('moment');
var async = require('async');

var util = require('../util');
var config = util.getConfig();
var dirs = util.dirs();
var log = require(dirs.core + 'log');

var adapter = config[config.adapter];
var Reader = require(dirs.gekko + adapter.path + '/reader');

var reader = new Reader();

// todo: rewrite with generators or async/await..
var scan = function(done) {
  log.info('Scanning local history for backtestable dateranges.');

  reader.tableExists('candles', (err, exists) => {

    if(err)
      return done(err, null, reader);

    if(!exists)
      return done(null, [], reader);

    async.parallel({
      boundry: reader.getBoundry,
      available: reader.countTotal
    }, (err, res) => {

      var first = res.boundry.first;
      var last = res.boundry.last;

      var optimal = (last - first) / 60;

      log.debug('Available', res.available);
      log.debug('Optimal', optimal);

      // There is a candle for every minute
      if(res.available === optimal + 1) {
        log.info('Gekko is able to fully use the local history.');
        return done(false, [{
          from: first,
          to: last
        }], reader);
      }

      // figure out where the gaps are..

      var missing = optimal - res.available + 1;

      log.info(`The database has ${missing} candles missing, Figuring out which ones...`);
      
      var iterator = {
        from: last - (BATCH_SIZE * 60),
        to: last
      }

      var batches = [];

      // loop through all candles we have
      // in batches and track whether they
      // are complete
      async.whilst(
          () => {
            return iterator.from > first
          },
          next => {
            var from = iterator.from;
            var to = iterator.to;
            reader.count(
              from,
              iterator.to,
              (err, count) => {
                var complete = count + MISSING_CANDLES_ALLOWED > BATCH_SIZE;

                if(complete)
                  batches.push({
                    to: to,
                    from: from
                  });

                next();
              }
            );

            iterator.from -= BATCH_SIZE * 60;
            iterator.to -= BATCH_SIZE * 60;
          },
          () => {
            
            if(!_.size(batches))
              util.die('Not enough data to work with (please manually set a valid `backtest.daterange`)..', true);

            // batches is now a list like
            // [ {from: unix, to: unix } ]
            
            var ranges = [ batches.shift() ];

            _.each(batches, batch => {
              var curRange = _.last(ranges);
              if(batch.to === curRange.from)
                curRange.from = batch.from;
              else
                ranges.push( batch );
            })

            // we have been counting chronologically reversed
            // (backwards, from now into the past), flip definitions
            ranges = ranges.reverse();
            _.map(ranges, r => {
              return {
                from: r.to,
                to: r.from
              }
            });


            // ranges is now a list like
            // [ {from: unix, to: unix } ]
            //
            // it contains all valid dataranges available for the
            // end user.

            return done(false, ranges, reader);
          }
        )
    });

  });
}

module.exports = scan;