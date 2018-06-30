<template lang='pug'>
  div.my2
    .contain(v-if='!data')
      h1 Unknown Gekko instance
      p Gekko doesn't know what gekko this is...
    div(v-if='data')
      h2.contain Gekko {{ type }}
      .grd.contain
        .grd-row
          .grd-row-col-3-6
            h3 Market
            .grd-row
              .grd-row-col-3-6 Exchange
              .grd-row-col-3-6 {{ config.watch.exchange }}
            .grd-row
              .grd-row-col-3-6 Currency
              .grd-row-col-3-6 {{ config.watch.currency }}
            .grd-row
              .grd-row-col-3-6 Asset
              .grd-row-col-3-6 {{ config.watch.asset }}
            .grd-row
              .grd-row-col-3-6 Type
              .grd-row-col-3-6 {{ type }}
          .grd-row-col-3-6
            h3 Runtime
            spinner(v-if='isLoading')
            template(v-if='!isLoading')
              .grd-row(v-if='initialEvents.candle')
                .grd-row-col-2-6 Watching since
                .grd-row-col-4-6 {{ fmt(initialEvents.candle.start) }}
              .grd-row(v-if='latestEvents.candle')
                .grd-row-col-2-6 Received data until
                .grd-row-col-4-6 {{ fmt(latestEvents.candle.start) }}
              .grd-row(v-if='latestEvents.candle')
                .grd-row-col-2-6 Data spanning
                .grd-row-col-4-6 {{ humanizeDuration(moment(latestEvents.candle.start).diff(moment(initialEvents.candle.start))) }}
              template(v-if='isStratrunner')
                .grd-row
                  .grd-row-col-2-6 Amount of trades
                  .grd-row-col-4-6 {{ trades.length }}
                .grd-row
                  .grd-row-col-2-6 Candle size
                  .grd-row-col-4-6 {{ config.tradingAdvisor.candleSize }}
                .grd-row
                  .grd-row-col-2-6 History size
                  .grd-row-col-4-6 {{ config.tradingAdvisor.historySize }}
        .grd-row(v-if='isStratrunner')
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
                .grd-row-col-3-6 {{round(report.market / 100 * report.startPrice)}} {{ config.watch.currency }} ({{ round(report.market) }} %)
              .grd-row
                .grd-row-col-3-6 Profit
                .grd-row-col-3-6 {{ round(report.profit) }} {{ config.watch.currency }} ({{ round(report.relativeProfit) }} %)
              .grd-row
                .grd-row-col-3-6 Alpha
                .grd-row-col-3-6 {{ round(report.alpha) }} {{ config.watch.currency }}
        p(v-if='!watcher') WARNING: stale gekko, not attached to a watcher, please report 
          a(href='https://github.com/askmike/gekko/issues') here
          | .
        p(v-if='isStratrunner && watcher')
          em This gekko gets market data from 
            router-link(:to='"/live-gekkos/" + watcher.id') this market watcher
          | .
      template(v-if='!isLoading')
        h3.contain Market graph
        spinner(v-if='candleFetch === "fetching"')
        template(v-if='candleFetch === "fetched"')
          chart(:data='chartData', :height='300')
        roundtrips(v-if='isStratrunner', :roundtrips='roundtrips')
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
    id: function() {
      return this.$route.params.id;
    },
    gekkos: function() {
      return this.$store.state.gekkos;
    },
    data: function() {
      if(!this.gekkos)
        return false;
      if(_.has(this.gekkos, this.id))
        return this.gekkos[this.id];
      if(_.has(this.finishedGekkos, this.id))
        return this.finishedGekkos[this.id];

      return false;
    },
    config: function() {
      return _.get(this, 'data.config');
    },
    latestEvents: function() {
      return _.get(this, 'data.events.latest');
    },
    initialEvents: function() {
      return _.get(this, 'data.events.initial');
    },
    trades: function() {
      return _.get(this, 'data.events.trades') || [];
    },
    roundtrips: function() {
      return _.get(this, 'data.events.roundtrip') || [];
    },
    isLive: function() {
      return _.has(this.gekkos, this.id);
    },
    type: function() {
      return this.data.logType;
    },
    isStratrunner: function() {
      return this.type !== 'watcher';
    },
    chartData: function() {
      return {
        candles: this.candles,
        trades: this.trades
      }
    },
    report: function() {
      return _.get(this.latestEvents, 'performanceReport');
    },
    stratName: function() {
      if(this.data)
        return this.data.config.tradingAdvisor.method;
    },
    stratParams: function() {
      if(!this.data)
        return 'Loading...';

      let stratParams = Vue.util.extend({}, this.data.config[this.stratName]);
      delete stratParams.__empty;

      if(_.isEmpty(stratParams))
        return 'No parameters'

      return JSON.stringify(stratParams, null, 4);
    },
    isLoading: function() {
      if(!this.data)
        return true;
      if(!_.get(this.data, 'events.initial.candle'))
        return true;
      if(!_.get(this.data, 'events.latest.candle'))
        return true;

      return false;
    },
    watcher: function() {
      if(!this.isStratrunner) {
        return false;
      }

      let watch = Vue.util.extend({}, this.data.config.watch);
      return _.find(this.gekkos, g => {
        if(g.id === this.id)
          return false;

        return _.isEqual(watch, g.config.watch);
      });
    },
  },
  watch: {
    'data.events.latest.candle.start': function() {
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
    getCandles: _.throttle(function() {
      this.candleFetch = 'fetching';

      let to = this.data.events.latest.candle.start;
      let from = this.data.events.initial.candle.start;
      let candleSize = 1;

      if(this.type !== 'watcher') {
        candleSize = this.data.config.tradingAdvisor.candleSize;
      }

      let config = {
        watch: this.data.config.watch,
        daterange: {
          to, from
        },
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
    }, 1000 * 30)
  }
}
</script>

<style>
</style>
