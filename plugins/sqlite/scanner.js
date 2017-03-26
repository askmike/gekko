const _ = require('lodash');
const async = require('async');
const fs = require('fs');

const util = require('../../core/util.js');
const config = util.getConfig();
const dirs = util.dirs();

const sqlite3 = require('sqlite3');

// todo: rewrite with generators or async/await..
module.exports = done => {
  const dbDirectory = dirs.gekko + config.sqlite.dataDirectory

  if(!fs.existsSync(dbDirectory))
    return done(null, []);

  const files = fs.readdirSync(dbDirectory);

  const dbs = files
    .filter(f => {
      let parts = f.split('.');
      if(_.last(parts) === 'db')
        return true;
    })

  if(!_.size(dbs))
    return done(null, []);

  let markets = [];

  async.each(dbs, (db, next) => {

    const exchange = _.first(db.split('_'));
    const handle = new sqlite3.Database(dbDirectory + '/' + db, err => {
      if(err)
        return next(err);

      handle.all(`SELECT name FROM sqlite_master WHERE type='table'`, (err, tables) => {
        if(err)
          return next(err);
        
        _.each(tables, table => {
          let parts = table.name.split('_');
          let first = parts.shift();
          if(first === 'candles') 
            markets.push({
              exchange: exchange,
              currency: _.first(parts),
              asset: _.last(parts)
            });
        });

        next();
      });
    });


  },
  // got all tables!
  err => {
    done(err, markets);
  });
}