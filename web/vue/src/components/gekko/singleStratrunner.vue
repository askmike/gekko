<template lang='jade'>
  div.my2
    .contain(v-if='!data')
      h1 Unknown Strat runner
      p Gekko doesn't know what strat runner this is...
    div(v-if='data')
      h2.contain Strat runner
      .grd.contain
        .grd-row
          .grd-row-col-3-6
            h3 Market
            .grd-row
              .grd-row-col-3-6 Exchange
              .grd-row-col-3-6 {{ data.watch.exchange }}
            .grd-row
              .grd-row-col-3-6 Currency
              .grd-row-col-3-6 {{ data.watch.currency }}
            .grd-row
              .grd-row-col-3-6 Asset
              .grd-row-col-3-6 {{ data.watch.asset }}
          .grd-row-col-3-6
            h3 Runtime
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
              .grd-row(v-if='data.lastCandle && data.firstCandle')
                .grd-row-col-2-6 Amount of trades
                .grd-row-col-4-6 {{ data.trades.length }}
        .grd-row
          .grd-row-col-3-6
            h3 Strategy
            .grd-row
              .grd-row-col-3-6 Name
              .grd-row-col-3-6
                strong {{ stratName }}
            | Parameters
            pre {{ stratParams }}
          .grd-row-col-3-6
            h3 Profit report
            template(v-if='!report')
              p
                em Waiting for at least one trade..
            template(v-if='report') 
              .grd-row
                .grd-row-col-3-6 Start balance
                .grd-row-col-3-6 {{ round(report.startBalance) }}
              .grd-row
                .grd-row-col-3-6 Current balance
                .grd-row-col-3-6 {{ round(report.balance) }}
              .grd-row
                .grd-row-col-3-6 Market
                .grd-row-col-3-6 {{ round(report.market) }} {{ data.watch.currency }}
              .grd-row
                .grd-row-col-3-6 Profit
                .grd-row-col-3-6 {{ round(report.profit) }} {{ data.watch.currency }}
              .grd-row
                .grd-row-col-3-6 Alpha
                .grd-row-col-3-6 {{ round(report.alpha) }} {{ data.watch.currency }}
        p(v-if='watcher')
          em This strat runner gets data from 
            router-link(:to='"/live-gekkos/watcher/" + watcher.id') this market watcher
          | .
      template(v-if='!isLoading')
        h3.contain Market graph
        spinner(v-if='candleFetch === "fetching"')
        template(v-if='candleFetch === "fetched"')
          chart(:data='chartData', :height='300')
        roundtrips(:roundtrips='data.roundtrips')

</template>

<script>

import Vue from 'vue'
import _ from 'lodash'

import { post } from '../../tools/ajax'
import spinner from '../global/blockSpinner.vue'
import chart from '../backtester/result/chartWrapper.vue'
import roundtrips from '../backtester/result/roundtripTable.vue'
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
    paperTradeSummary,
    roundtrips
  },
  data: () => {
    return {
      candleFetch: 'idle',
      candles: false
    }
  },
  computed: {
    stratrunners: function() {
      return this.$store.state.stratrunners;
    },
    data: function() {
      return _.find(this.stratrunners, {id: this.$route.params.id});
    },
    chartData: function() {
      return {
        candles: this.candles,
        trades: this.trades
      }
    },
    trades: function() {
      if(!this.data)
        return [];

      return this.data.trades;
    },
    report: function() {
      if(!this.data)
        return;

      return this.data.report;
    },
    stratName: function() {
      if(this.data)
        return this.data.strat.tradingAdvisor.method;
    },
    stratParams: function() {
      if(!this.data)
        return '';

      let stratParams = Vue.util.extend({}, this.data.strat.params);
      delete stratParams.__empty;

      if(_.isEmpty(stratParams))
        return 'No parameters'

      return JSON.stringify(stratParams, null, 4);
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
    round: n => (+n).toFixed(5),
    humanizeDuration: (n) => window.humanizeDuration(n),
    moment: mom => moment.utc(mom),
    fmt: mom => moment.utc(mom).format('YYYY-MM-DD HH:mm'),
    getCandles: function() {
      this.candleFetch = 'fetching';

      let to = this.data.lastCandle.start;
      let from = this.data.firstCandle.start;
      let candleSize = this.data.strat.tradingAdvisor.candleSize;

      let config = {
          watch: this.data.watch,
          daterange: {
            to, from
          },
          // hourly candles
          candleSize
        };

      post('getCandles', config, (err, res) => {
        this.candleFetch = 'fetched';
        // todo
        if(!res || res.error || !_.isArray(res))
          return console.log(res);

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
