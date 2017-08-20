const fs = require('fs');
const moment = require('moment');
const _ = require('lodash');

const BASEPATH = __dirname + '/../../logs/';

const Logger = function(type) {

  const now = moment().utc().format('YYYY-MM-DD-HH-mm');
  this.fileName = `${now}-UTC-${type}.log`;

  this.writing = false;
  this.queue = [];

  _.bindAll(this);
}

Logger.prototype.write = function(line) {
  if(!this.writing) {
    this.writing = true;
    fs.appendFile(
      BASEPATH + this.fileName,
      line + '\n',
      this.handleWriteCallback
    );
  } else
    this.queue.push(line);
}

Logger.prototype.handleWriteCallback = function(err) {
  if(err)
    console.error(`ERROR WRITING LOG FILE ${this.fileName}:`, err);

  this.writing = false;

  if(_.size(this.queue))
    this.write(this.queue.shift())
}

module.exports = Logger;