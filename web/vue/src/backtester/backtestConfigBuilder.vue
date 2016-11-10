<template lang='jade'>
.contain
  .grd
    .grd-row
      .grd-row-col-3-6.mx1
        h3 Market
        market-picker.contain(v-on:market='updateMarket')
      .grd-row-col-3-6.mx1
        range-picker(v-on:range='updateRange', :config='market')
  .hr
  strat-picker.contain.my2(v-on:stratConfig='updateStrat')
</template>

<script>

import marketPicker from '../global/configbuilder/marketpicker.vue'
import stratPicker from '../global/configbuilder/stratpicker.vue'
import rangePicker from '../global/configbuilder/rangepicker.vue'
import _ from 'lodash'

export default {
  data: () => {
    return {
      market: {},
      strat: {},
      range: {}
    }
  },
  components: {
    marketPicker,
    stratPicker,
    rangePicker
  },
  computed: {
    config: function() {
      let config = {};
      Object.assign(
        config,
        this.market,
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
    updateMarket: function(mc) {
      this.market = mc;
      this.$emit('config', this.config);
    },
    updateRange: function(range) {
      this.range = range;
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
