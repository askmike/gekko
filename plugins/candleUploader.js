const axios = require('axios');
const _ = require('lodash');
const log = require('../core/log.js');
const util = require('../core/util.js');
const config = util.getConfig();

const CandleUploader = function(done) {
  _.bindAll(this);

  done();
  this.candles = [];
  this.schedule();
};

CandleUploader.prototype.processCandle = function(candle, done) {
  this.candles.push(candle);
  done();
};

CandleUploader.prototype.schedule = function() {
  this.timer = setTimeout(this.upload, 10 * 1000);
}

CandleUploader.prototype.upload = function() {
  const amount = this.candles.length;
  if(!amount) {
    return this.schedule();
  }

  axios({
    url: config.candleUploader.url,
    method: 'post',
    data: {
      apiKey: config.candleUploader.apiKey,
      watch: config.watch,
      candles: this.candles
    }
  })
    .then(r => {
      if(r.data.success === false) {
        console.log('error uploading:', r.data);
      }
      console.log(new Date, 'uploaded', amount, 'candles');
      this.schedule();
    })
    .catch(e => {
      console.log('error uploading:', e.message);
      this.schedule();
    });

  this.candles = [];
}

CandleUploader.prototype.finish = function(next) {
  this.upload();
  clearTimeout(this.timer);
}

module.exports = CandleUploader;
