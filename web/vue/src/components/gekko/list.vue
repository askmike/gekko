<template lang='jade'>
  .contain.py2
    .text(v-html='text')
    .hr
    h3 Market watchers
    .text(v-if='!watchers.length')
      p You are currently not watching any markets.
    table.full(v-if='watchers.length')
      thead
        tr
          th exchange
          th currency
          th asset
          th started at
          th last update
          th duration
      tbody
        tr.clickable(v-for='gekko in watchers', v-on:click='$router.push({path: `live-gekkos/watcher/${gekko.id}`})')
          td {{ gekko.watch.exchange }}
          td {{ gekko.watch.currency }}
          td {{ gekko.watch.asset }}
          td {{ fmt(gekko.startAt) }}
          td {{ fmt(gekko.latest) }}
          td {{ humanizeDuration(moment(gekko.latest).diff(moment(gekko.startAt))) }}
    .hr
    h3 Strat runners
    .text(v-if='!stratrunners.length')
      p You are currently not running any strategies.
    table.full(v-if='stratrunners.length')
      thead
        tr
          th exchange
          th currency
          th asset
          th started at
          th last update
          th duration
          th type
      tbody
        tr.clickable(v-for='gekko in gekkos', v-on:click='$router.push({path: `live-gekkos/gekko/${gekko.id}`})')
          td {{ gekko.watch.exchange }}
          td {{ gekko.watch.currency }}
          td {{ gekko.watch.asset }}
          td {{ fmt(gekko.startAt) }}
          td {{ fmt(gekko.latest) }}
          td {{ humanizeDuration(gekko.latest.diff(gekko.startAt)) }}
          td {{ gekko.type }}
    .hr
    h2 Start a new live Gekko
    router-link(to='/live-gekkos/new') start a new live Gekko!
</template>

<script>

import marked from '../../tools/marked';
// global moment
// global humanizeDuration

const text = marked(`

## Live Gekko

You can use Gekko to run your strategy against the live market!

For this you run a live gekko, which consists of two parts:

- A market watcher: this will in realtime gather data from a market (like "Bitstamp:USD/BTC").
- A strategy: this will use the realtime data from the marketwatcher and run a strategy over it.

*Right now the strategy will be evalutated using a paper trader. If you want to automatically trade using your strat, you have to use the command line for now.*

`);

export default {
  data: () => {
    return {
      text,
    }
  },
  computed: {
    stratrunners: function() {
      return this.$store.state.stratrunners
    },
    watchers: function() {
      return this.$store.state.watchers
    }
  },
  methods: {
    humanizeDuration: (n) => window.humanizeDuration(n),
    moment: mom => moment.utc(mom),
    fmt: mom => moment.utc(mom).format('YYYY-MM-DD HH:mm')
  }
}
</script>

<style>
tr.clickable {
  cursor: pointer;
}
tr.clickable:hover {
  background: rgba(216,216,216,.99);
}
</style>
