const config = require('./vue/UIconfig');

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

const cache = require('./state/cache');
const ListManager = require('./state/listManager');

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

// initialize lists and dump into cache
cache.set('imports', new ListManager);
cache.set('gekkos', new ListManager);
cache.set('apiKeyManager', require('./apiKeyManager'));

// setup API routes

const WEBROOT = __dirname + '/';
const ROUTE = n => WEBROOT + 'routes/' + n;

// attach routes
const apiKeys = require(ROUTE('apiKeys'));
router.get('/api/strategies', require(ROUTE('strategies')));
router.get('/api/configPart/:part', require(ROUTE('configPart')));
router.get('/api/apiKeys', apiKeys.get);

const listWraper = require(ROUTE('list'));
router.get('/api/imports', listWraper('imports'));
router.get('/api/gekkos', listWraper('gekkos'));
router.get('/api/exchanges', require(ROUTE('exchanges')));

router.post('/api/addApiKey', apiKeys.add);
router.post('/api/removeApiKey', apiKeys.remove);
router.post('/api/scan', require(ROUTE('scanDateRange')));
router.post('/api/scansets', require(ROUTE('scanDatasets')));
router.post('/api/backtest', require(ROUTE('backtest')));
router.post('/api/import', require(ROUTE('import')));
router.post('/api/startGekko', require(ROUTE('startGekko')));
router.post('/api/killGekko', require(ROUTE('killGekko')));
router.post('/api/getCandles', require(ROUTE('getCandles')));


// incoming WS:
// wss.on('connection', ws => {
//   ws.on('message', _.noop);
// });

app
  .use(cors())
  .use(serve(WEBROOT + 'vue'))
  .use(bodyParser())
  .use(require('koa-logger')())
  .use(router.routes())
  .use(router.allowedMethods());

server.timeout = config.api.timeout||120000;
server.on('request', app.callback());
server.listen(config.api.port, config.api.host, '::', () => {
  const host = `${config.ui.host}:${config.ui.port}${config.ui.path}`;

  if(config.ui.ssl) {
    var location = `https://${host}`;
  } else {
    var location = `http://${host}`;
  }

  console.log('Serving Gekko UI on ' + location +  '\n');


  // only open a browser when running `node gekko`
  // this prevents opening the browser during development
  let nodeCommand = _.last(process.argv[1].split('/'));
  if(nodeCommand === 'gekko' && !config.headless) {
    opn(location)
      .catch(err => {
        console.log('Something went wrong when trying to open your web browser. UI is running on ' + location + '.');
    });
  }
});
