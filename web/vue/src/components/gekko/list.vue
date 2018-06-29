<template lang='pug'>
  .contain.py2
    .text(v-html='text')
    .hr
    h3 Market watchers
    .text(v-if='!watchers.length')
      p You are currently not watching any markets.
    table.full.clickable(v-if='watchers.length')
      thead
        tr
          th exchange
          th currency
          th asset
          th started at
          th last update
          th duration
      tbody
        tr.clickable(v-for='gekko in watchers', v-on:click='$router.push({path: `live-gekkos/${gekko.id}`})')
          td {{ gekko.config.watch.exchange }}
          td {{ gekko.config.watch.currency }}
          td {{ gekko.config.watch.asset }}
          td
            template(v-if='gekko.events.initial.candle') {{ fmt(gekko.events.initial.candle.start) }}
          td
            template(v-if='gekko.events.latest.candle') {{ fmt(gekko.events.latest.candle.start) }}
          td
            template(v-if='gekko.events.initial.candle && gekko.events.latest.candle') {{ timespan(gekko.events.latest.candle.start, gekko.events.initial.candle.start) }}
    h3 Strat runners
    .text(v-if='!stratrunners.length')
      p You are currently not running any strategies.
    table.full(v-if='stratrunners.length')
      thead
        tr
          th exchange
          th currency
          th asset
          th last update
          th duration
          th strategy
          th PnL
          th type
          th trades
      tbody
        tr.clickable(v-for='gekko in stratrunners', v-on:click='$router.push({path: `live-gekkos/${gekko.id}`})')
          td {{ gekko.config.watch.exchange }}
          td {{ gekko.config.watch.currency }}
          td {{ gekko.config.watch.asset }}
          td
            template(v-if='gekko.events.latest.candle') {{ fmt(gekko.events.latest.candle.start) }}
          td
            template(v-if='gekko.events.initial.candle && gekko.events.latest.candle') {{ timespan(gekko.events.latest.candle.start, gekko.events.initial.candle.start) }}
          td {{ gekko.config.tradingAdvisor.method }}
          td
            template(v-if='!gekko.report') 0
            template(v-if='gekko.report') {{ round(gekko.report.profit) }} {{ gekko.watch.currency }}
          td {{ gekko.logType }}
          td
            template(v-if='!gekko.events.trades') 0
            template(v-if='gekko.events.trades') {{ gekko.events.trades.length }}
    .hr
    h2 Start a new live Gekko
    router-link.btn--primary(to='/live-gekkos/new') Start a new live Gekko!
</template>

<script>

import marked from '../../tools/marked'
// global moment
// global humanizeDuration

const text = marked(`

## Live Gekko

Run your strategy against the live market!

`);

export default {
  data: () => {
    return {
      text
    }
  },
  created: function() {
    this.timer = setInterval(() => {
      this.now = moment();
    }, 1000)
  },
  destroyed: function() {
    clearTimeout(this.timer);
  },
  data: () => {
    return {
      text,
      timer: false,
      now: moment()
    }
  },
  computed: {
    stratrunners: function() {
      return _.values(this.$store.state.gekkos)
        .filter(g => {
          if(g.logType === 'papertrader')
            return true;

          if(g.logType === 'tradebot')
            return true;

          return false;
        });
    },
    watchers: function() {
      return _.values(this.$store.state.gekkos)
        .filter(g => g.logType === 'watcher')
    }
  },
  methods: {
    humanizeDuration: (n) => window.humanizeDuration(n),
    moment: mom => moment.utc(mom),
    fmt: mom => moment.utc(mom).format('YYYY-MM-DD HH:mm'),
    round: n => (+n).toFixed(3),
    timespan: function(a, b) {
      return this.humanizeDuration(this.moment(a).diff(this.moment(b)))
    }
  }
}
</script>

<style>
table.clickable {
  border-collapse: separate;
}

tr.clickable td:nth-child(1) {
  padding-left: 5px;
}

tr.clickable {
  cursor: pointer;
}
tr.clickable:hover {
  background: rgba(216,216,216,.99);
}
</style>
