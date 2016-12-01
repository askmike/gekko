<template lang='jade'>
  div.contain.my2
    h3 Start a new gekko
    gekko-config-builder(v-on:config='updateConfig')
    .hr
    .txt--center(v-if='config.valid')
      a.w100--s.my1.btn--blue(href='#', v-on:click.prevent='start') Start
</template>

<script>

import Vue from 'vue'
import { post } from '../../tools/ajax'
import gekkoConfigBuilder from './gekkoConfigBuilder.vue'

export default {
  components: {
    gekkoConfigBuilder
  },
  data: () => {
    return {
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
    gekkoConfig: function() {
      let gekkoConfig = Vue.util.extend({}, this.config);
      gekkoConfig.mode = 'leech';
      return gekkoConfig;
    },
    existingMarketWatcher: function() {
      let market = Vue.util.extend({}, this.watchConfig.watch);
      return _.find(this.watchers, {watch: market});
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
          console.log('ROUTING TO EXISTING MARKETWATCHER');
        } else {
          this.startWatcher(function(error, resp) {
            console.log('ROUTING TO NEW MARKETWATCHER');
          });
        }

      } else {

        // defer until watcher is done
        let startGekko = () => {
          this.startGekko(function(error, resp) {
            console.log('ROUTING TO GEKKO');
          });
        }

        if(!this.existingMarketWatcher) {
          // the specified market is not yet being watched,
          // we need to create a watcher
          this.startWatcher(startGekko);
        } else {
          startGekko();
        }
      }
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
