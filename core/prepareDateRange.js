var _ = require('lodash');
var prompt = require('prompt-lite');
var moment = require('moment');

var util = require('./util');
var config = util.getConfig();
var dirs = util.dirs();
var log = require(dirs.core + 'log');

var scan = require(dirs.tools + 'dateRangeScanner');

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
  scan((err, ranges) => {

    if(_.size(ranges) === 0)
      util.die('No history found for this market', true);

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

  });
}