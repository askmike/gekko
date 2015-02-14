// All plugins supported by Gekko.
// 
// Required parameters per plugin.
// 
// name: Name of the actor
// slug: filename of the actor, expected to be in `gekko/plugins/`
//     description: text describing the plugin.
// async: upon creating a new actor instance, does something async
//    happen where Gekko needs to wait for? If set to true, the
//    constructor will be passed a callback which it should execute
//    as soon as Gekko can continue setup.
// modes: a list indicating in what Gekko modes this actor is
//    allowed to run. Realtime is during a live market watch and
//    backtest is during a backtest.
// dependencies: a list of external npm modules this plugin requires to
//    be installed.
// emits: does this plugin emits events?
var plugins = [
  {
    name: 'Trading Advisor',
    description: 'Calculate trading advice',
    slug: 'tradingAdvisor',
    async: false,
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
    description: 'Sends you email yourself everytime Gekko has new advice.',
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
