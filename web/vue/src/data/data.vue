<template lang='jade'>
  .contain
    .text(v-html='intro')
    .hr
    h2 Available datasets
    .txt--center.my2(v-if='scanstate === "idle"')
      a.w100--s.btn--blue.scan-btn(href='#', v-on:click.prevent='scan') scan available data
    .txt--center.my2(v-if='scanstate === "scanning"')
      spinner
    .my2(v-if='scanstate === "scanned"')
      table.full
        thead
          tr
            th exchange
            th currency
            th asset
            th from
            th to
            th duration
        tbody
          tr(v-for='set in datasets')
            td {{ set.exchange }}
            td {{ set.currency }}
            td {{ set.asset }}
            td {{ fmt(set.from) }}
            td {{ fmt(set.to) }}
            td {{ humanizeDuration(set.to.diff(set.from)) }}
    .my2
      h2 Import more data
      p.text You can easily import more market data directly from the exchange using the importer.
      router-link(to='/data/importer') Go to the importer.
</template>

<script>

import spinner from '../global/blockSpinner.vue'
import { post } from '../tools/ajax'
import marked from '../tools/marked'
// global moment
// global humanizeDuration

let intro = marked(`

## Local data

Gekko needs local market data in order to backtest strategies. The local
data can also be used in a warmup period when running a strategy against a
live market.

`);

export default {
  components: {
    spinner
  },
  data: () => {
    return {
      intro,
      datasets: [],
      scanstate: 'idle'
    }
  },
  methods: {
    scan: function() {
      this.scanstate = 'scanning';

      post('scansets', {}, (error, response) => {
        this.scanstate = 'scanned';

        let sets = [];

        response.forEach(market => {
          market.ranges.forEach(range => {
            sets.push({
              exchange: market.exchange,
              currency: market.currency,
              asset: market.asset,
              from: moment.unix(range.from).utc(),
              to: moment.unix(range.to).utc()
            });
          });
        });

        // for now, filter out sets smaller than 3 hours..
        sets = sets.filter(set => {
          if(set.to.diff(set.from, 'hours') > 2)
            return true;
        });

        sets = sets.sort((a, b) => {
          let adiff = a.to.diff(a.from);
          let bdiff = b.to.diff(b.from);

          if(adiff < bdiff)
            return -1;

          if(adiff > bdiff)
            return 1;

          return 0;
        }).reverse();

        this.datasets = sets;
      })
    },
    humanizeDuration: (n) => window.humanizeDuration(n),
    fmt: mom => mom.format('YYYY-MM-DD HH:mm')
  }
}
</script>

<style>
table.full {
  width: 100%;
}

table.full td {
  padding: 0.5rem 0;
}

table.full th {
  text-align: center;
}
</style>
