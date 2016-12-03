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
        template(v-if='candles.length')
          p CHART!
</template>

<script>

import { post } from '../../tools/ajax'
import _ from 'lodash'
import spinner from '../global/blockSpinner.vue'
import Vue from 'vue'
// global moment

export default {
  components: {
    spinner
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

      console.log('last start', this.data.lastCandle.start);
      console.log('first start', this.data.firstCandle.start)

      // up unto we have data
      let to = moment.utc(
        this.data.lastCandle.start
      ).format();

      console.log('to', to);

      // max 7 days of data
      let from = Math.max(
        moment.utc(this.data.firstCandle.start).subtract(7, 'days').unix(),
        moment.utc(to).subtract(7, 'days').unix()
      )

      console.log('from1', from);

      from = moment.unix(from).utc().format();

      console.log('from2', from);

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
