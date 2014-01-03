// what kind of actors does Gekko support?
// 
// An actor is a module/plugin that acts whenever an event happens.
// In Gekko there are two types of events and each type originates
// from a feed:
// 
// - Market Events: the market feed.
// - Advice Events: the advice feed.
// 
// Each type has it's own feed.
// 
// Required parameters per actor.
// 
// name: Name of the actor
// slug: filename of the actor, expected to be in `gekko/actors/`
// description: text describing the actor. Unused on silent actors.
// async: upon creating a new actor instance, does something async
//    happen where Gekko needs to wait for? If set to true, the
//    constructor will be passed a callback which it should execute
//    as soon as Gekko can continue setup.
// silent: indicated whether Gekko should log when this actor is
//    configured. Not neccesary for until components.
// modes: a list indicating in what Gekko modes this actor is
//    allowed to run. Realtime is during a live market watch and
//    backtest is during a backtest.
// requires: a list of npm modules this actor requires to be 
//    installed.
// originates: does this actor originate a feed (internally used)
var actors = [
  {
    name: 'Trading Advisor',
    description: 'Calculate trading advice based',
    slug: 'tradingAdvisor',
    async: false,
    silent: false,
    modes: ['realtime', 'backtest'],
    originates: [{
      feed: 'advice feed',
      object: 'method'
    }]
  },
  {
    name: 'IRC bot',
    description: 'IRC module lets you communicate with Gekko on IRC.',
    slug: 'ircbot',
    async: false,
    silent: false,
    modes: ['realtime']
  },
  {
    name: 'Mailer',
    description: 'Mail module lets sends you mail yourself everytime Gekko has new advice',
    slug: 'mailer',
    async: true,
    silent: false,
    modes: ['realtime']
  },
  {
    name: 'Profit Simulator',
    description: 'Paper trader that logs fake profits.',
    slug: 'profitSimulator',
    async: false,
    silent: false,
    modes: ['realtime', 'backtest']
  },
  {
    name: 'Advice logger',
    description: '',
    slug: 'adviceLogger',
    async: false,
    silent: true,
    modes: ['realtime', 'backtest']
  }
];

module.exports = actors;