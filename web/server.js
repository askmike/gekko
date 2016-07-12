var server = require('http').createServer();
var url = require('url');
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({ server: server });
var koa = require('koa');
var serve = require('koa-static');
var router = require('koa-router')();
var bodyParser = require('koa-bodyparser');
var ws = require('ws');
var app = koa();
var _ = require('lodash');

var port = 3000;

router.get('/api/ping', function *() {
  this.body = 'pong'
});
 
router.post('/api/backtest', function *() {
  var mode = 'backtest';

  var body = JSON.parse(this.request.body.data);

  var config = require('../config.js');

  _.merge(config, body);

  config.debug = false;

  var broadcast = m => {
    wss.clients.forEach(function each(client) {
      client.send(JSON.stringify({type: 'log', message: m}));
    });
  }

  require('./gekko-runner')(mode, config, broadcast);

  this.body = 'ok';
});

wss.on('connection', function connection(ws) {
  var location = url.parse(ws.upgradeReq.url, true);
 
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });
 
  ws.send(JSON.stringify({date: 'something'}));
});

app
  .use(serve('frontend'))
  .use(bodyParser())
  .use(router.routes())
  .use(router.allowedMethods());

server.on('request', app.callback());
server.listen(port, () => console.log('Listening on ' + server.address().port));