<template lang='jade'>
.config-builder.my2
  market-picker.contain(v-on:marketConfig='onMarketConfig', has='rangepicker')
  .hr.contain
  strat-picker.contain(v-on:stratConfig='onStratConfig')
</template>

<script>

import marketPicker from './marketpicker.vue'
import stratPicker from './stratpicker.vue'

export default {
  data: () => {
    return {
      marketConfig: {},
      stratConfig: {}
    }
  },
  components: {
    marketPicker,
    stratPicker
  },
  computed: {
    config: function() {
      let config = {};
      Object.assign(
        config,
        this.marketConfig,
        this.stratConfig
      );

      if(this.validConfig(config))
        config.valid = true;

      return config;
    }
  },
  methods: {
    validConfig: function(config) {
      if(!config.backtest.daterange)
        return false;

      if(!config.watch)
        return false;

      if(!config.tradingAdvisor)
        return false;

      return true;
    },
    onMarketConfig: function(mc) {
      this.marketConfig = mc;
      this.$emit('config', this.config);
    },
    onStratConfig: function(sc) {
      this.stratConfig = sc;
      this.$emit('config', this.config);
    }
  }
}
</script>

<style>

input {
  background: none;
  margin-top: 0.5em;
}

.params {
  min-height: 235px;
  line-height: 1.3em;
}

.hr {
  margin-top: 2rem;
  margin-bottom: 2rem;
  height: 10px;
  background-color: rgba(250,250,250,.99);
}
</style>
