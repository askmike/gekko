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
// subscriptions: list of feeds that contian the events this actor
// async: upon creating a new actor instance, does something async
//    happen where Gekko needs to wait for? If set to true, the
//    constructor will be passed a callback which it should execute
//    as soon as Gekko can continue setup.
// silent: indicated whether Gekko should log when this actor is
//    configured. Not neccesary for until components.
// originates: does this actor originate a feed (internally used)

var config = require('./core/util').getConfig();
var actors = [
  {
    name: 'Trading Advisor',
    description: 'Calculate trading advice based on the ' + config.tradingAdvisor.method,
    slug: 'tradingAdvisor',
    subscriptions: ['market feed'],
    async: false,
    silent: false,
    originates: [{
      feed: 'advice feed',
      object: 'method'
    }]
  },
  {
    name: 'IRC bot',
    description: 'IRC module lets you communicate with Gekko on IRC.',
    slug: 'ircbot',
    subscriptions: ['market feed', 'advice feed'],
    async: false,
    silent: false
  },
  {
    name: 'Mailer',
    description: 'Mail module lets sends you mail yourself everytime Gekko has new advice',
    slug: 'mailer',
    subscriptions: ['advice feed'],
    async: true,
    silent: false
  },
  {
    name: 'Profit Simulator',
    description: 'Setup paper trading and log fake profits.',
    slug: 'profitSimulator',
    subscriptions: ['market feed', 'advice feed'],
    async: false,
    silent: false
  },
  {
    name: 'Advice logger',
    description: '',
    slug: 'adviceLogger',
    subscriptions: ['market feed', 'advice feed'],
    async: false,
    silent: true
  }
];

module.exports = actors;