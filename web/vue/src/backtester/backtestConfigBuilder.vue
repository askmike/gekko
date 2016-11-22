<template lang='jade'>
.contain
  dataset-picker.contain.my2(v-on:dataset='updateDataset')
  .hr
  strat-picker.contain.my2(v-on:stratConfig='updateStrat')
</template>

<script>

import datasetPicker from '../global/configbuilder/datasetpicker.vue'
import stratPicker from '../global/configbuilder/stratpicker.vue'
import _ from 'lodash'

export default {
  data: () => {
    return {
      dataset: {},
      strat: {},
    }
  },
  components: {
    stratPicker,
    datasetPicker
  },
  computed: {
    market: function() {
      if(!this.dataset.exchange)
        return {};

      return {
        exchange: this.dataset.exchange,
        currency: this.dataset.currency,
        asset: this.dataset.asset
      }
    },
    range: function() {
      if(!this.dataset.exchange)
        return {};

      return {
        from: this.dataset.from,
        to: this.dataset.to
      }
    },
    config: function() {
      let config = {};
      Object.assign(
        config,
        {
          watch: this.market
        },
        this.strat,
        {
          backtest: {
            daterange: this.range
          }
        }
      );

      if(this.validConfig(config))
        config.valid = true;

      return config;
    }
  },
  methods: {
    validConfig: function(config) {
      if(!config.backtest)
        return false;

      if(!config.backtest.daterange)
        return false;

      if(_.isEmpty(config.backtest.daterange))
        return false;

      if(!config.watch)
        return false;

      if(!config.tradingAdvisor)
        return false;

      if(config.tradingAdvisor) {
        if(_.isNaN(config.tradingAdvisor.candleSize))
          return false;
        else if(config.tradingAdvisor.candleSize == 0)
          return false;
      }

      return true;
    },
    updateDataset: function(set) {
      this.dataset = set;
      // console.log('updateDataset', set);
      this.$emit('config', this.config);
    },
    updateStrat: function(sc) {
      this.strat = sc;
      this.$emit('config', this.config);
    }
  }
}
</script>

<style>
</style>
