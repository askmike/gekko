<template lang='jade'>
  div.contain.my2
    div(v-if='!data')
      h1 Unknown Watcher
      p Gekko doesn't know what whatcher this is...
    div(v-if='data')
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
          .grd-row-col-2-6 Data spanning
          .grd-row-col-4-6 {{ humanizeDuration(moment(data.latest).diff(moment(data.startAt))) }}
        h3 Market graph
        spinner(v-if='candleFetch === "fetching"')
        template(v-if='candleFetch === "fetched"')
        p CHART!
</template>

<script>

import { post } from '../../tools/ajax'
import _ from 'lodash'
import spinner from '../global/blockSpinner.vue'

export default {
  components: {
    spinner
  },
  data: () => {
    return {
      candleFetch: 'idle'
    }
  },
  computed: {
    watchers: function() {
      return this.$store.state.watchers;
    },
    data: function() {
      return _.find(this.watchers, {id: this.$route.params.id});
    },
    getCandleConfig: () => {
      return {
        watch: {
          exchange: 'poloniex',
          currency: 'USDT',
          asset: 'BTC'
        },
        daterange: {
          from: '2016-05-22 11:22',
          to: '2016-06-03 19:56'
        },
        adapter: 'sqlite',
        sqlite: {
          path: 'plugins/sqlite',

          dataDirectory: 'history',
          version: 0.1,

          dependencies: [{
            module: 'sqlite3',
            version: '3.1.4'
          }]
        },
        candleSize: 100
      }
    }
  },
  watch: {
    data: function(val) {
      console.log('watch data', val, this.candleFetch);
      if(val && this.candleFetch !== 'fetched')
        this.getCandles();
    }
  },
  methods: {
    humanizeDuration: (n) => window.humanizeDuration(n),
    moment: mom => moment.utc(mom),
    fmt: mom => moment.utc(mom).format('YYYY-MM-DD HH:mm'),
    getCandles: function() {
      console.log()

      this.candleFetch = 'fetching';
      post('getCandles', this.getCandleConfig, (err, res) => {
        this.candleFetch = 'fetched';
        console.log(err, res);
      })
    }
  }
}
</script>

<style>
</style>
