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
        .grd-row(v-if='data.firstCandle')
          .grd-row-col-2-6 Watching since
          .grd-row-col-4-6 {{ fmt(data.firstCandle.start) }}
        .grd-row(v-if='data.lastCandle')
          .grd-row-col-2-6 Received data until
          .grd-row-col-4-6 {{ fmt(data.lastCandle.start) }}
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
  created: function() {
    if(
      this.data &&
      this.candleFetch !== 'fetched' &&
      this.data.firstCandle
    )
      this.getCandles();
  },
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
    },
    candles: function() {
      console.log(moment.unix(_.first(this.candles).start).format())
      console.log(moment.unix(_.last(this.candles).start).format())
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
      ).unix();

      // max 7 days of data
      let from = Math.max(
        moment.utc(this.data.firstCandle.start).unix(),
        moment.utc(to).subtract(7, 'days').unix()
      );

      const diff = to - from;
      let candleSize = 60;
      if(diff < 60 * 60 * 24) // a day
        if(diff < 60 * 60 * 12) // 3 hours
          candleSize = 1;
        else
          candleSize = 5;

      console.log(diff, candleSize);

      from = moment.unix(from).utc().format();
      to = moment.unix(to).utc().format();

      let config = Vue.util.extend(
        {
          watch: this.data.watch,
          daterange: {
            to, from
          },
          // hourly candles
          candleSize
        },
        this.baseCandleConfig
      );

      post('getCandles', config, (err, res) => {
        this.candleFetch = 'fetched';
        this.candles = res.map(c => {
          c.start = moment.unix(c.start).utc().format();
          return c;
        });
      })
    }
  }
}
</script>

<style>
</style>
