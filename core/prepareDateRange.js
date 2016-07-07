var _ = require('lodash');
var moment = require('moment');
var async = require('async');

var util = require('./util');
var config = util.getConfig();
var dirs = util.dirs();
var adapter = config.adapters[config.backtest.adapter];
var Reader = require(dirs.gekko + adapter.path + '/reader');
var log = require(dirs.core + 'log');
var prompt = require('prompt-lite');

var reader = new Reader();

var BATCH_SIZE = 60; // minutes

// helper to store the evenutally detected
// daterange.
var setDateRange = function(from, to) {
  config.backtest.daterange = {
    from: moment.unix(from).utc().format(),
    to: moment.unix(to).utc().format(),
  };
  util.setConfig(config);
}


module.exports = function(done) {

  log.info('Scanning local history for backtestable dateranges.');

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
      setDateRange(first, last);
      return done();
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
              var complete = count === BATCH_SIZE + 1;

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

          if(_.size(ranges) === 1) {
            var r = _.first(ranges);
            log.info('Gekko was able to find a single daterange in the locally stored history:');
            log.info('\t', 'from:', moment.unix(r.from).utc().format('YYYY-MM-DD HH:mm:ss'));
            log.info('\t', 'to:', moment.unix(r.to).utc().format('YYYY-MM-DD HH:mm:ss'));

            setDateRange(r.from, r.to);
            return done();
          }

          log.info(
            'Gekko detected multiple dateranges in the locally stored history.',
            'Please pick the daterange you are interested in testing:'
          );

          _.each(ranges, (range, i) => {
            log.info('\t\t', `OPTION ${i + 1}:`);
            log.info('\t', 'from:', moment.unix(range.from).utc().format('YYYY-MM-DD HH:mm:ss'));
            log.info('\t', 'to:', moment.unix(range.to).utc().format('YYYY-MM-DD HH:mm:ss'));
          });

          prompt.get({name: 'option'}, (err, result) => {

            var option = parseInt(result.option);
            if(option === NaN)
              util.die('Not an option..', true);

            var range = ranges[option - 1];

            if(!range)
              util.die('Not an option..', true);

            setDateRange(range.from, range.to);
            return done();
          });

        }
      )


  });
}