// config somewhere?
var port = 3000;
var relayInterval = 250;

var server = require('http').createServer();
var url = require('url');
// var WebSocketServer = require('ws').Server;
// var wss = new WebSocketServer({ server: server });
var koa = require('koa');
var serve = require('koa-static');
var cors = require('koa-cors');
var router = require('koa-router')();
var bodyParser = require('koa-bodyparser');
// var ws = require('ws');
var app = koa();
var _ = require('lodash');

// var messages = {};
// // buffer internally
// var broadcast = data => {
//   if(!messages[data.type])
//     messages[data.type] = [];

//   messages[data.type].push(data.message);
// }

// // publish in batches
// var _broadcast = data => {
//   if(_.isEmpty(messages))
//     return;

//   _.each(
//     wss.clients,
//     client => client.send(JSON.stringify(messages))
//   );
//   messages = {};
// }
// setInterval(_broadcast, relayInterval);

app.use(cors());

// attach routes
router.post('/api/scan', require('./routes/scanDateRange'));
router.post('/api/backtest', require('./routes/backtest'));
router.get('/api/strategies', require('./routes/strategies'));

// wss.on('connection', ws => {
//   ws.on('message', _.noop);
//   ws.send(JSON.stringify({state: 'ready'}));
// });

app
  .use(serve('vue'))
  .use(bodyParser())
  .use(router.routes())
  .use(router.allowedMethods());

server.on('request', app.callback());
server.listen(port, () => console.log('Listening on ' + server.address().port));