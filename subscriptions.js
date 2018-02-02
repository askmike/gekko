// 
// Subscriptions glue plugins to events
// flowing through the Gekko.
// 

var subscriptions = [
  {
    emitter: 'market',
    event: 'candle',
    handler: 'processCandle'
  },
  {
    emitter: 'market',
    event: 'marketUpdate',
    handler: 'processMarketUpdate'
  },
  {
    emitter: 'market',
    event: 'marketStart',
    handler: 'processMarketStart'
  },
  {
    emitter: 'tradingAdvisor',
    event: 'advice',
    handler: 'processAdvice'
  },
  {
    emitter: 'tradingAdvisor',
    event: 'stratStart',
    handler: 'processStratStart'
  },
  {
    emitter: 'tradingAdvisor',
    event: 'stratUpdate',
    handler: 'processStratUpdate'
  },
  {
    emitter: ['trader', 'paperTrader'],
    event: 'trade',
    handler: 'processTrade'
  },
  {
    emitter: ['trader', 'paperTrader'],
    event: 'portfolioUpdate',
    handler: 'processPortfolioUpdate'
  },
];

module.exports = subscriptions;