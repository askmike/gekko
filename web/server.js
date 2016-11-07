// config somewhere?
const port = 3000;
const relayInterval = 250;

const koa = require('koa');
const serve = require('koa-static');
const cors = require('koa-cors');
const _ = require('lodash');
const bodyParser = require('koa-bodyparser');

const opn = require('opn');
const server = require('http').createServer();
const router = require('koa-router')();
const ws = require('ws');
const app = koa();

const WebSocketServer = require('ws').Server;
const wss = new WebSocketServer({ server: server });

const cache = require('./cache');

// broadcast function
const broadcast = data => {
  if(_.isEmpty(data))
    return;

  _.each(
    wss.clients,
    client => client.send(JSON.stringify(data))
  );
}
cache.set('broadcast', broadcast);

setInterval(() => {
  console.log('broadcasting..');
  let m = {
    type: 'a',
    payload: Math.random()
  }
  broadcast(m);
}, 5000)

const WEBROOT = __dirname + '/';

app.use(cors());

// attach routes
router.post('/api/scan', require(WEBROOT + 'routes/scanDateRange'));
router.post('/api/backtest', require(WEBROOT + 'routes/backtest'));
router.get('/api/strategies', require(WEBROOT + 'routes/strategies'));

// wss.on('connection', ws => {
//   ws.on('message', _.noop);
// });

app
  .use(serve(WEBROOT + 'vue'))
  .use(bodyParser())
  .use(router.routes())
  .use(router.allowedMethods());

server.on('request', app.callback());
server.listen(port, () => {
  let host = 'http://localhost';
  console.log('Serving Gekko UI on ' + host + ':' + server.address().port);
  // opn(host + ':' + server.address().port);
});