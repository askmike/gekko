//
// Current state: early prototype
//
// todo: express maybe?
//

//
// Spawn a nodejs webserver
//

var _ = require('lodash');
var async = require('async');
var config = require('../core/util').getConfig();
// we are going to send it to web clients, remove
// potential private information
delete config.mailer;

var serverConfig = config.webserver;

var ws = require("zwebsocket");
var http = require("http");
var fs = require('fs');

var Server = function() {
  _.bindAll(this);

  this.history = false;
  this.index;

  // static assets Gekko
  // can pass
  this.assets = [
    '/css/style.css',
    '/js/d3.chart.js',
    '/js/d3.candlechart.js',
    '/js/main.js'
  ]
}

Server.prototype.setup = function(next) {
  async.series(
    [
      this.cacheIndex,
      this.setupHTTP,
      this.setupWS
    ],
    next
  );
}

Server.prototype.cacheIndex = function(next) {
  fs.readFile(__dirname + '/frontend/index.html', 'utf8', _.bind(function(err, file) {
    if(err)
       throw err;

    // The frontend needs to know where the
    // webserver is. Best way to pass this
    // for now.
    this.index = file
      .replace('{{port}}', serverConfig.ws.port)
      .replace('{{host}}', serverConfig.ws.host);

    next();
  }, this));
}

Server.prototype.setupHTTP = function(next) {
  this.http = http.createServer(this.handleHTTPConnection)
    .listen(serverConfig.http.port, next);
}

Server.prototype.broadcastHistory = function(data) {
  this.history = data;
  this.broadcast({
    message: 'history',
    data: data
  });
}

Server.prototype.broadcastSmallCandle = function(candle) {
  this.broadcast({
    message: 'candle',
    data: candle
  });
}

Server.prototype.broadcastAdvice = function() {}

Server.prototype.broadcastTrade = function(trade) {
  this.broadcast({
    message: 'trade',
    data: trade
  });
}

Server.prototype.handleHTTPConnection = function(req, res) {

  if(req.url === '/') {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(this.index);
  } if(_.contains(this.assets, req.url)) {
    res.writeHead(200, {'Content-Type': 'application/javascript;'});
    console.log('./frontend' + req.url);
    fs.createReadStream(__dirname + '/frontend' + req.url).pipe(res)
  } else {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end('<h1>404 :(</h1>');
  }
}

Server.prototype.setupWS = function(next) {
  this.ws = ws.createServer(this.handleWSConnection)
    .listen(serverConfig.ws.port, next);
}

Server.prototype.send = function(conn, obj) {
  conn.sendText(JSON.stringify(obj));
}

Server.prototype.broadcast = function(obj) {
  _.each(this.ws.connections, function(conn) {
    this.send(conn, obj);
  }, this);
}

Server.prototype.handleWSConnection = function(conn) {
  if(this.history)
    this.send(conn, {
      message: 'history',
      data: this.history
    });

  this.send(conn, {
    message: 'config',
    data: config
  });

  conn.on("text", function(json) {
    // TODO: handle incoming requests
    // from client

    // var message = JSON.parse(json);
    // console.log(json);
  });
  conn.on("close", function(code, reason) {});
  conn.on("error", function(code, reason) {});
}
module.exports = Server;
