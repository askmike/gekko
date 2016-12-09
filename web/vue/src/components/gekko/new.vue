<template lang='jade'>
  div.contain.my2
    h3 Start a new gekko
    gekko-config-builder(v-on:config='updateConfig')
    .hr
    .txt--center(v-if='config.valid')
      a.w100--s.my1.btn--blue(href='#', v-on:click.prevent='start') Start
</template>

<script>

import _ from 'lodash'
import Vue from 'vue'
import { post } from '../../tools/ajax'
import gekkoConfigBuilder from './gekkoConfigBuilder.vue'

export default {
  components: {
    gekkoConfigBuilder
  },
  data: () => {
    return {
      pendingStratrunner: false,
      config: {}
    }
  },
  computed: {
    watchers: function() {
      return this.$store.state.watchers;
    },
    watchConfig: function() {
      let raw = _.pick(this.config, 'watch', 'candleWriter');
      let watchConfig = Vue.util.extend({}, raw);
      watchConfig.type = 'market watcher';
      watchConfig.mode = 'realtime';
      return watchConfig;
    },
    requiredHistoricalData: function() {
      if(!this.config.tradingAdvisor || !this.config.valid)
        return;

      let stratSettings = this.config.tradingAdvisor;
      return stratSettings.candleSize * stratSettings.historySize;
    },
    gekkoConfig: function() {
      var startAt;

      if(!this.existingMarketWatcher)
        return;

      if(!this.requiredHistoricalData)
        startAt = moment().utc().startOf('minute').format();
      else {
        // TODO: figure out whether we can stitch data
        // without looking at the existing watcher
        let optimal = moment().utc().startOf('minute')
          .subtract(this.requiredHistoricalData, 'minutes')
          .unix();

        let available = moment
          .utc(this.existingMarketWatcher.firstCandle.start)
          .unix();

        startAt = moment.unix(Math.max(optimal, available)).utc().format();
      }

      let gekkoConfig = Vue.util.extend({
        market: {
          type: 'leech',
          from: startAt
        },
        mode: 'realtime'
      }, this.config);
      return gekkoConfig;
    },
    existingMarketWatcher: function() {
      let market = Vue.util.extend({}, this.watchConfig.watch);
      return _.find(this.watchers, {watch: market});
    }
  },
  watch: {
    // start the stratrunner
    existingMarketWatcher: function(val, prev) {
      if(!this.pendingStratrunner)
        return;

      if(val && val.firstCandle && val.lastCandle) {
        this.pendingStratrunner = false;

        this.startGekko((err, resp) => {
          this.$router.push({
            path: `/live-gekkos/stratrunner/${resp.id}`
          });
        });
      }
    }
  },
  methods: {
    updateConfig: function(config) {
      this.config = config;
    },
    start: function() {
      // internally a live gekko consists of two parts:
      //
      // - a market watcher
      // - a live gekko (strat runner + paper trader)
      //
      // however if the user selected type "market watcher"
      // the second part won't be created
      if(this.config.type === 'market watcher') {

        // check if the specified market is already being watched
        if(this.existingMarketWatcher) {
          alert('This market is already being watched, redirecting you now...')
          this.$router.push({
            path: `/live-gekkos/watcher/${this.existingMarketWatcher.id}`
          });
        } else {
          this.startWatcher((error, resp) => {
            this.$router.push({
              path: `/live-gekkos/watcher/${resp.id}`
            });
          });
        }

      } else {

        if(this.existingMarketWatcher) {
          // the specified market is already being watched,
          // just start a gekko!
          startGekko(this.routeToGekko);
          
        } else {
          // the specified market is not yet being watched,
          // we need to create a watcher
          this.startWatcher((err, resp) => {
            this.pendingStratrunner = true;
            // now we just wait for 
          });
        }
      }
    },
    routeToGekko: function(err, resp) {
      if(err || resp.error)
        return console.error(err, resp.error);

      this.$router.push({
        path: `/live-gekkos/stratrunner/${resp.id}`
      });
    },
    startWatcher: function(next) {
      post('startGekko', this.watchConfig, next);
    },
    startGekko: function(next) {
      post('startGekko', this.gekkoConfig, next);
    }
  }
}
</script>

<style>
</style>
