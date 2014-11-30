// 
// Subscriptions glue actors to events
// flowing through the Gekko. This 
// specifies how actors can be glued
// to events and where those events
// are emitted from (internally).
// 
// 
// TODO: STREAMS!

var subscriptions = [

  // heart
  {
    emitter: 'heart',
    event: 'start',
    handler: 'onStart'
  },
  {
    emitter: 'heart',
    event: 'tick',
    handler: 'onTick'
  },

  // marketDataProvider
  {
    emitter: 'marketDataProvider',
    event: 'trades',
    handler: 'onTrades'
  },


  // candleManager
  {
    emitter: 'candleManager',
    event: 'candles',
    handler: 'processCandles'
  },
  {
    emitter: 'candleManager',
    event: 'ready',
    handler: 'onReady'
  },


  // tradingAdvisor
  {
    emitter: 'tradingAdvisor',
    event: 'advice',
    handler: 'processAdvice'
  }
];

module.exports = subscriptions;