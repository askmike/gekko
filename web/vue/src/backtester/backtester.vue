<template lang='jade'>
  div
    h2.px2.contain Run a backtest
    .hr.contain
    config-builder
</template>

<script>
import configBuilder from './configbuilder/configbuilder.vue'

export default {
  data: () => {
    return {
      range: false,
      dateRanges: [],
      scanned: false,
      backtestResult: false,
      watchConfig: false,
    }
  },
  methods: {
    setRange: function(range) {
      this.range = range;
    },
    onConfig: function(config) {
      console.log(config.watch, this.watchConfig);
      if(!_.isEqual(this.watchConfig, config.watch)) {
        // market changed (or new)
        this.scanned = false;
        this.checkDateRange(config);
        this.watchConfig = _.clone(config.watch);
      }
    },
    checkDateRange: function(config) {
      let to = 'http://localhost:3000/api/scan';
      this.$http.post(to, config).then((response) => {
        this.scanned = true;
        this.dateRanges = response.body;
      });
    },
    run: function(config) {
      let to = 'http://localhost:3000/api/backtest';
      this.$http.post(to, config).then((response) => {
        console.log(response);
      });
    }
  },
  components: {
    configBuilder
  }
}
</script>

<style>
.contain {
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;
}
</style>
