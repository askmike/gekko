// All plugins supported by Gekko.
// 
//  Required parameters per plugin.
// 
// name: Name of the plugin
// slug: name of the plugin mapped to the config key. Expected
//    filename to exist in `gekko/plugins/` (only if path is not
//    specified)
// async: upon creating a new plugin instance, does something async
//    happen where Gekko needs to wait for? If set to true, the
//    constructor will be passed a callback which it should execute
//    as soon as Gekko can continue.
// modes: a list indicating in what Gekko modes this plugin is
//    allowed to run. Realtime is during a live market watch and
//    backtest is during a backtest.
//    
//  Optional parameters per plugin.
//    
// description: text describing the plugin.
// dependencies: a list of external npm modules this plugin requires to
//    be installed.
// emits: events emitted by this plugin that other plugins can subscribe to.
// path: path of file of the plugin (overwrites `gekko/plugins/{slug}`)
var plugins = [
  {
    name: 'SQLite Datastore',
    description: 'Store candles, trades and advices in a SQLite database',
    slug: 'sqliteWriter',
    async: true,
    modes: ['realtime'],
    dependencies: [{
      module: 'sqlite3',
      version: '3.1.3'
    }],
    path: 'sqlite/writer',
    version: 0.1,
  },
  {
    name: 'Trading Advisor',
    description: 'Calculate trading advice',
    slug: 'tradingAdvisor',
    async: true,
    modes: ['realtime', 'backtest'],
    emits: ['advice']
  },
  {
    name: 'IRC bot',
    description: 'IRC module lets you communicate with Gekko on IRC.',
    slug: 'ircbot',
    async: false,
    modes: ['realtime'],
    dependencies: [{
      module: 'irc',
      version: '0.3.6'
    }]
  },
  {
    name: 'Campfire bot',
    description: 'Lets you communicate with Gekko on Campfire.',
    slug: 'campfire',
    async: false,
    modes: ['realtime'],
    dependencies: [{
      module: 'ranger',
      version: '0.2.4'
    }]
  },
  {
    name: 'Mailer',
    description: 'Sends you an email everytime Gekko has new advice.',
    slug: 'mailer',
    async: true,
    modes: ['realtime'],
    dependencies: [{
      module: 'emailjs',
      version: '0.3.6'
    }, {
      module: 'prompt-lite',
      version: '0.1.1'
    }]
  },
  {
    name: 'Trader',
    description: 'Follows the advice and create real orders.',
    slug: 'trader',
    async: true,
    modes: ['realtime']
  },
  {
    name: 'Advice logger',
    description: '',
    slug: 'adviceLogger',
    async: false,
    silent: true,
    modes: ['realtime', 'backtest']
  },
  {
    name: 'Profit Simulator',
    description: 'Paper trader that logs fake profits.',
    slug: 'profitSimulator',
    async: false,
    modes: ['realtime', 'backtest']
  },
  {
    name: 'Redis beacon',
    slug: 'redisBeacon',
    description: 'Publish events over Redis Pub/Sub',
    async: true,
    modes: ['realtime'],
    dependencies: [{
      module: 'redis',
      version: '0.10.0'
    }]
  }
];

module.exports = plugins;
