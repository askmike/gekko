const axios = require('axios');
const _ = require('lodash');
const log = require('../core/log.js');
const util = require('../core/util.js');
const config = util.getConfig();

const CandleUploader = function(done) {
  _.bindAll(this);
  done();
};

CandleUploader.prototype.processCandle = function(candle, done) {
  console.log(new Date, 'uploading', candle);
  axios({
    url: config.candleUploader.url,
    method: 'post',
    data: {
      apiKey: config.candleUploader.apiKey,
      watch: config.watch,
      candles: [ candle ]
    }
  })
    .then(r => {
      if(r.data.success === false) {
        console.log('error uploading:', r.data);
      }
    })
    .catch(e => {
      console.log('error uploading:', e.message);
    });

  done();
};

module.exports = CandleUploader;
