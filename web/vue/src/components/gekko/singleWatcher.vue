<template lang='jade'>
  div.contain.my2
    div(v-if='!data')
      h1 Unknown Watcher
      p Gekko doesn't know what whatcher this is...
    div(v-if='data && !error')
      h2 Market Watcher
      .grd
        h3 Market
        .grd-row
          .grd-row-col-2-6 Exchange
          .grd-row-col-4-6 {{ data.watch.exchange }}
        .grd-row
          .grd-row-col-2-6 Currency
          .grd-row-col-4-6 {{ data.watch.currency }}
        .grd-row
          .grd-row-col-2-6 Asset
          .grd-row-col-4-6 {{ data.watch.asset }}
        h3 Statistics
        .grd-row
          .grd-row-col-2-6 Watching since
          .grd-row-col-4-6 {{ fmt(data.startAt) }}
        .grd-row
          .grd-row-col-2-6 Received data until
          .grd-row-col-4-6 {{ fmt(data.latest) }}
        .grd-row
          .grd-row-col-2-6 Running for
          .grd-row-col-4-6 {{ humanizeDuration(moment(data.latest).diff(moment(data.startAt))) }}
        h3 Market graph
        p TODO: candle price graph!
</template>

<script>

import { get } from '../../tools/ajax'
import _ from 'lodash'

export default {
  created: function() {
    // todo: get data and spawn chart
  },
  computed: {
    watchers: function() {
      return this.$store.state.watchers;
    },
    data: function() {
      return _.find(this.watchers, {id: this.$route.params.id});
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
</style>
