<template lang='jade'>
  div.my2
    .contain(v-if='!data')
      h1 Unknown Strat runner
      p Gekko doesn't know what strat runner this is...
    div(v-if='data')
      h2.contain Strat runner
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
        p(v-if='watcher')
          em This strat runner gets data from 
            router-link(:to='"/live-gekkos/watcher/" + watcher.id') this market watcher
          | .
        h3 Statistics
        spinner(v-if='isLoading')
        template(v-if='!isLoading')
          .grd-row(v-if='data.firstCandle')
            .grd-row-col-2-6 Watching since
            .grd-row-col-4-6 {{ fmt(data.firstCandle.start) }}
          .grd-row(v-if='data.lastCandle')
            .grd-row-col-2-6 Received data until
            .grd-row-col-4-6 {{ fmt(data.lastCandle.start) }}
          .grd-row(v-if='data.lastCandle && data.firstCandle')
            .grd-row-col-2-6 Data spanning
            .grd-row-col-4-6 {{ humanizeDuration(moment(data.lastCandle.start).diff(moment(data.firstCandle.start))) }}
          .grd-row.summary
            // paperTradeSummary(:report='report')
      template(v-if='!isLoading')
        h3.contain Market graph
        spinner(v-if='candleFetch === "fetching"')
        template(v-if='candles.length')
          chart(:data='chartData')
</template>

<script>

import Vue from 'vue'
import _ from 'lodash'

import { post } from '../../tools/ajax'
import spinner from '../global/blockSpinner.vue'
import chart from '../backtester/result/chartWrapper.vue'
import paperTradeSummary from '../global/paperTradeSummary.vue'
// global moment

export default {
  created: function() {
    if(!this.isLoading)
      this.getCandles();
  },
  components: {
    spinner,
    chart,
    paperTradeSummary
  },
  data: () => {
    return {
      candleFetch: 'idle',
      candles: []
    }
  },
  computed: {
    stratrunners: function() {
      return this.$store.state.stratrunners;
    },
    data: function() {
      return _.find(this.stratrunners, {id: this.$route.params.id});
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
    },
    isLoading: function() {
      if(!this.data)
        return true;
      if(!_.isObject(this.data.firstCandle))
        return true;
      if(!_.isObject(this.data.lastCandle))
        return true;

      return false;
    },
    watchers: function() {
      return this.$store.state.watchers;
    },
    watcher: function() {
      let watch = Vue.util.extend({}, this.data.watch);
      return _.find(this.watchers, { watch });
    },
  },
  watch: {
    'data.lastCandle.start': function() {
      this.candleFetch = 'dirty';
    },
    data: function(val, prev) {
      if(this.isLoading)
        return;

      if(this.candleFetch !== 'fetched' )
        this.getCandles();
    }
  },
  methods: {
    humanizeDuration: (n) => window.humanizeDuration(n),
    moment: mom => moment.utc(mom),
    fmt: mom => moment.utc(mom).format('YYYY-MM-DD HH:mm'),
    getCandles: function() {
      this.candleFetch = 'fetching';

      let to = this.data.lastCandle.start;
      let from = this.data.firstCandle.start;
      let candleSize = this.data.strat.tradingAdvisor.candleSize;

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
        // if(!res || res.error)
        // todo..

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
