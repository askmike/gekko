<template lang='pug'>
  div.my2
    .contain(v-if='!data')
      h1 Unknown Gekko instance
      p Gekko doesn't know what gekko this is...
    div(v-if='data')
      h2.contain Gekko {{ type }}
      div(v-if='isArchived', class='contain brdr--mid-gray p1 bg--orange')
        | This is an archived Gekko, it is currently not running anymore.
      div(v-if='data.errorMessage', class='contain brdr--mid-gray p1 bg--orange')
        | This is Gekko crashed with the following error: {{ data.errorMessage }}
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
        div(v-if='warmupRemaining', class='contain brdr--mid-gray p1 bg--orange')
          | This stratrunner is still warming up for the next 
          i {{ warmupRemaining.replace(',', ' and ') }}
          | , it will not trade until it is warmed up.
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
                em(v-if='isArchived') This Gekko never executed a trade..
                em(v-if='!isArchived') Waiting for at least one trade..
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
        p(v-if='isStratrunner && !watcher && !isArchived') WARNING: stale gekko, not attached to a watcher, please report 
          a(href='https://github.com/askmike/gekko/issues') here
          | .
        p(v-if='!isArchived')
          a(v-on:click='stopGekko', class='w100--s my1 btn--red') Stop Gekko
        p(v-if='isArchived')
          a(v-on:click='deleteGekko', class='w100--s my1 btn--red') Delete Gekko
        p(v-if='isStratrunner && watcher && !isArchived')
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
    archivedGekkos: function() {
      return this.$store.state.archivedGekkos;
    },
    data: function() {
      if(!this.gekkos)
        return false;
      if(_.has(this.gekkos, this.id))
        return this.gekkos[this.id];
      if(_.has(this.archivedGekkos, this.id))
        return this.archivedGekkos[this.id];

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
      return _.get(this, 'data.events.tradeCompleted') || [];
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
    isArchived: function() {
      return this.data.stopped;
    },
    warmupRemaining: function() {
      if(!this.isStratrunner) {
        return false;
      }

      if(this.isArchived) {
        return false;
      }

      if(this.initialEvents.stratWarmupCompleted) {
        return false;
      }

      if(!this.initialEvents.candle) {
        return false;
      }

      const historySize = _.get(this.config, 'tradingAdvisor.historySize');

      if(!historySize) {
        return false;
      }

      const warmupTime = _.get(this.config, 'tradingAdvisor.candleSize') * historySize;

      return humanizeDuration(
        moment(this.initialEvents.candle.start).add(warmupTime, 'm').diff(moment()),
        { largest: 2 }
      );
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
    hasLeechers: function() {
      if(this.isStratrunner) {
        return false;
      }

      let watch = Vue.util.extend({}, this.data.config.watch);

      return _.find(this.gekkos, g => {
        if(g.id === this.id)
          return false;

        return _.isEqual(watch, g.config.watch);
      });
    }
  },
  watch: {
    'data.events.latest.candle.start': function() {
      setTimeout(this.getCandles, _.random(100, 2000));
    }
  },
  methods: {
    round: n => (+n).toFixed(5),
    humanizeDuration: (n, x) => window.humanizeDuration(n, x),
    moment: mom => moment.utc(mom),
    fmt: mom => moment.utc(mom).format('YYYY-MM-DD HH:mm'),
    getCandles: function() {
      if(this.isLoading) {
        return;
      }

      if(this.candleFetch === 'fetching') {
        return;
      }

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

      // We timeout because of 2 reasons:
      // - In case we get a batch of candles we only fetch once
      // - This way we give the db (mostly sqlite) some time to write
      //   the result before we query it.
      setTimeout(() => {
        post('getCandles', config, (err, res) => {
          this.candleFetch = 'fetched';
          if(!res || res.error || !_.isArray(res))
            return console.log(res);

          this.candles = res.map(c => {
            c.start = moment.unix(c.start).utc().format();
            return c;
          });
        })
      }, _.random(150, 2500));
    },
    stopGekko: function() {
      if(this.hasLeechers) {
        return alert('This Gekko is fetching market data for multiple stratrunners, stop these first.');
      }

      if(!confirm('Are you sure you want to stop this Gekko?')) {
        return;
      }

      post('stopGekko', { id: this.data.id }, (err, res) => {
        console.log('stopped gekko');
      });
    },
    deleteGekko: function() {
      if(!this.isArchived) {
        return alert('This Gekko is still running, stop it first!');
      }

      if(!confirm('Are you sure you want to delete this Gekko?')) {
        return;
      }

      post('deleteGekko', { id: this.data.id }, (err, res) => {
        this.$router.push({
          path: `/live-gekkos/`
        });
      });
    }
  }
}
</script>

<style>
</style>
