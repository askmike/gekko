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


var messages = {};
var broadcast = data => {
  if(!messages[data.type])
    messages[data.type] = [];

  messages[data.type].push(data.message);
}

var _broadcast = data => {
  if(_.isEmpty(messages))
    return;

  _.each(wss.clients, client => client.send(JSON.stringify(messages)))
  messages = {};
}

setInterval(_broadcast, 125);

var backtest = require('./routes/backtest')(broadcast);
router.post('/api/backtest', backtest);

wss.on('connection', function connection(ws) {
  var location = url.parse(ws.upgradeReq.url, true);
 
  ws.on('message', _.noop);
 
  ws.send(JSON.stringify({state: 'ready'}));
});

app
  .use(serve('frontend'))
  .use(bodyParser())
  .use(router.routes())
  .use(router.allowedMethods());

server.on('request', app.callback());
server.listen(port, () => console.log('Listening on ' + server.address().port));