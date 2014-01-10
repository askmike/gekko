// 
// Subscriptions glue actors to events
// flowing through the Gekko. This 
// specifies how actors can be glued
// to events and where those events
// are emitted from (internally).
// 

var subscriptions = [
  {
    emitter: 'market',
    event: 'candle',
    handler: 'processCandle'
  },
  {
    emitter: 'market',
    event: 'small candle',
    handler: 'processSmallCandle'
  },
  {
    emitter: 'market',
    event: 'trade',
    handler: 'processTrade'
  },
  {
    emitter: 'market',
    event: 'history',
    handler: 'processHistory'
  },
  {
    emitter: 'advisor',
    event: 'advice',
    handler: 'processAdvice'
  }
];

module.exports = subscriptions;