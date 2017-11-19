<template lang='jade'>
  .contain
    .text(v-html='intro')
    .hr
    h2 Available datasets
    .txt--center.my2(v-if='datasetScanstate === "idle"')
      a.w100--s.btn--primary.scan-btn(href='#', v-on:click.prevent='scan') Scan available data
    .txt--center.my2(v-if='datasetScanstate === "scanning"')
      spinner
    .my2(v-if='datasetScanstate === "scanned"')
      .bg--orange.p1.warning.my1(v-if='unscannableMakets.length')
        p.clickable(v-if='!viewUnscannable', v-on:click.prevent='toggleUnscannable') Some markets were unscannable, click here for details.
        template(v-if='viewUnscannable')
          p Unable to find datasets in the following markets:
          .mx2(v-for='market in unscannableMakets')
            | - {{ market.exchange }}:{{ market.currency }}:{{ market.asset }}
      template(v-if='datasets.length')
        table.full.data
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
      template(v-if='!datasets.length')
        p It looks like you don't have any local data yet.
    .my2
      h2 Import more data
      p.text You can easily import more market data directly from exchanges using the importer.
      router-link.btn--primary(to='/data/importer') Go to the importer!
</template>

<script>

import spinner from '../global/blockSpinner.vue'
import marked from '../../tools/marked'
import dataset from '../global/mixins/dataset'
// global moment
// global humanizeDuration

let intro = marked(`

## Local data

Gekko needs local market data in order to backtest strategies. The local
data can also be used in a warmup period when running a strategy against a
live market.

`);

export default {
  mixins: [ dataset ],
  components: {
    spinner
  },
  data: () => {
    return {
      intro,
      viewUnscannable: false
    }
  },
  methods: {
    toggleUnscannable: function() { this.viewUnscannable = true },
    humanizeDuration: (n) => window.humanizeDuration(n),
    fmt: mom => mom.format('YYYY-MM-DD HH:mm'),
  }
}
</script>

<style>

.clickable {
  cursor: pointer;
}

table.full {
  width: 100%;
}

table.full td {
  padding: 0.5rem 0;
}

table.full.data th {
  text-align: left;
  padding: 0.5rem 0;
}

.warning p {
  margin: 0;
  padding: 0;
}
</style>
