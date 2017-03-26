<template lang='jade'>
.grd.contain
  .grd-row
    .grd-row-col-3-6.mx1
      h3 Market
      market-picker.contain(v-on:market='updateMarketConfig')
    .grd-row-col-3-6.mx1
      type-picker(v-on:type='updateType')
  template(v-if='type === "paper trader"')
    .hr
    strat-picker.contain.my2(v-on:stratConfig='updateStrat')
    .hr
    paper-trader(v-on:settings='updatePaperTrader')
</template>

<script>

import marketPicker from '../global/configbuilder/marketpicker.vue'
import typePicker from '../global/configbuilder/typepicker.vue'
import stratPicker from '../global/configbuilder/stratpicker.vue'
import paperTrader from '../global/configbuilder/papertrader.vue'
import { get } from '../../tools/ajax'
import _ from 'lodash'

export default {

  created: function() {
    get('configPart/candleWriter', (error, response) => {
      this.candleWriter = toml.parse(response.part);
    })
  },
  data: () => {
    return {
      market: {},
      range: {},
      type: '',
      strat: {},
      paperTrader: {},
      candleWriter: {}
    }
  },
  components: {
    marketPicker,
    typePicker,
    stratPicker,
    paperTrader
  },
  computed: {
    config: function() {
      let config = {};
      Object.assign(
        config,
        this.market,
        this.strat,
        { paperTrader: this.paperTrader },
        { candleWriter: this.candleWriter },
        { type: this.type }
      );

      config.valid = this.validConfig(config);

      return config;
    }
  },
  methods: {
    validConfig: config => {
      if(config.type === 'market watcher')
        return true;

      if(!config.tradingAdvisor)
        return false;
      if(_.isNaN(config.tradingAdvisor.candleSize))
        return false;
      else if(config.tradingAdvisor.candleSize == 0)
        return false;

      let strat = config.tradingAdvisor.method;
      if(_.isEmpty(config[ strat ]))
        return false;

      return true;
    },
    updateMarketConfig: function(mc) {
      this.market = mc;
      this.emitConfig();
    },
    updateType: function(type) {
      this.type = type;
      this.emitConfig();
    },
    updateStrat: function(strat) {
      this.strat = strat;
      this.emitConfig();
    },
    updatePaperTrader: function(pt) {
      this.paperTrader = pt;
      this.paperTrader.enabled = true;
      this.emitConfig();
    },

    emitConfig: function() {
      this.$emit('config', this.config); 
    }
  }
}
</script>

<style>
</style>
