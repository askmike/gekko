// internal modules of Gekko
var modules = [
  {
    slug: 'heart',
    emits: ['tick'],
    modes: ['realtime', 'backtest']
  },
  {
    name: 'Candle store',
    description: 'Save candles to and load candles from disk.',
    slug: 'candleStore',
    async: false,
    modes: ['realtime']
  },
  {
    slug: 'marketDataProvider',
    async: false,
    emits: ['trades', 'trade'],
    modes: ['realtime']
  },
  {
    slug: 'candleManager',
    async: false,
    emits: ['candles', 'small candles'],
    modes: ['realtime']
  }
]

var debug = require('./util')
  .getConfig()
  .debug;

if(debug)
  modules.unshift({
    slug: 'eventLogger',
    async: false,
    modes: ['realtime', 'backtest']
  });

module.exports = modules;