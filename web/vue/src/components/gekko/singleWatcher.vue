<template lang='jade'>
  div.my2
    .contain(v-if='!data')
      h1 Unknown Watcher
      p Gekko doesn't know what whatcher this is...
    div(v-if='data')
      h2.contain Market Watcher
      .grd.contain
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
      h3.contain Market graph
      spinner(v-if='candleFetch === "fetching"')
      template(v-if='candles.length')
        chart(:data='chartData')
</template>

<script>

import { post } from '../../tools/ajax'
import _ from 'lodash'
import spinner from '../global/blockSpinner.vue'
import Vue from 'vue'
import chart from '../backtester/result/chartWrapper.vue'
// global moment

export default {
  components: {
    spinner,
    chart
  },
  data: () => {
    return {
      candleFetch: 'idle',
      candles: []
    }
  },
  computed: {
    watchers: function() {
      return this.$store.state.watchers;
    },
    data: function() {
      return _.find(this.watchers, {id: this.$route.params.id});
    },
    baseCandleConfig: () => {
      return {
        adapter: 'sqlite',
        sqlite: {
          path: 'plugins/sqlite',

          dataDirectory: 'history',
          version: 0.1,

          dependencies: [{
            module: 'sqlite3',
            version: '3.1.4'
          }]
        }
      }
    },
    chartData: function() {
      return {
        candles: this.candles,
        trades: []
      }
    }
  },
  watch: {
    data: function(val) {
      if(
        val &&
        this.candleFetch !== 'fetched' &&
        this.data.firstCandle
      )
        this.getCandles();
    }
  },
  methods: {
    humanizeDuration: (n) => window.humanizeDuration(n),
    moment: mom => moment.utc(mom),
    fmt: mom => moment.utc(mom).format('YYYY-MM-DD HH:mm'),
    getCandles: function() {

      this.candleFetch = 'fetching';

      // up unto we have data
      let to = moment.utc(
        this.data.lastCandle.start
      ).format();

      // max 7 days of data
      let from = Math.max(
        moment.utc(this.data.firstCandle.start).subtract(7, 'days').unix(),
        moment.utc(to).subtract(7, 'days').unix()
      );

      from = moment.unix(from).utc().format();

      let config = Vue.util.extend(
        {
          watch: this.data.watch,
          daterange: {
            to, from
          },
          // hourly candles
          candleSize: 60
        },
        this.baseCandleConfig
      );

      post('getCandles', config, (err, res) => {
        this.candleFetch = 'fetched';
        this.candles = res;
      })
    }
  }
}
</script>

<style>
</style>
