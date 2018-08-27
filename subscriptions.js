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
    event: 'stratWarmupCompleted',
    handler: 'processStratWarmupCompleted'
  },
  {
    emitter: 'tradingAdvisor',
    event: 'advice',
    handler: 'processAdvice'
  },
  {
    emitter: 'tradingAdvisor',
    event: 'stratCandle',
    handler: 'processStratCandle'
  },
  {
    emitter: 'tradingAdvisor',
    event: 'stratUpdate',
    handler: 'processStratUpdate'
  },
  {
    emitter: 'tradingAdvisor',
    event: 'stratNotification',
    handler: 'processStratNotification'
  },
  {
    emitter: ['trader', 'paperTrader'],
    event: 'tradeInitiated',
    handler: 'processTradeInitiated'
  },
  {
    emitter: ['trader', 'paperTrader'],
    event: 'tradeAborted',
    handler: 'processTradeAborted'
  },
  {
    emitter: ['trader', 'paperTrader'],
    event: 'tradeCompleted',
    handler: 'processTradeCompleted'
  },
  {
    emitter: 'trader',
    event: 'tradeCancelled',
    handler: 'processTradeCancelled'
  },
  {
    emitter: 'trader',
    event: 'tradeErrored',
    handler: 'processTradeErrored'
  },
  {
    emitter: ['trader', 'paperTrader'],
    event: 'portfolioChange',
    handler: 'processPortfolioChange'
  },
  {
    emitter: ['trader', 'paperTrader'],
    event: 'triggerCreated',
    handler: 'processTriggerCreated'
  },
  {
    emitter: ['trader', 'paperTrader'],
    event: 'triggerAborted',
    handler: 'processTriggerAborted'
  },
  {
    emitter: ['trader', 'paperTrader'],
    event: 'triggerFired',
    handler: 'processTriggerFired'
  },
  {
    emitter: ['trader', 'paperTrader'],
    event: 'portfolioValueChange',
    handler: 'processPortfolioValueChange'
  },
  {
    emitter: 'performanceAnalyzer',
    event: 'performanceReport',
    handler: 'processPerformanceReport'
  },
  {
    emitter: 'performanceAnalyzer',
    event: 'roundtripUpdate',
    handler: 'processRoundtripUpdate'
  },
  {
    emitter: 'performanceAnalyzer',
    event: 'roundtrip',
    handler: 'processRoundtrip'
  },
];

module.exports = subscriptions;