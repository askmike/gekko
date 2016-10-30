<template lang='jade'>
.grd
  .grd-row
    .grd-row-col-3-6.mx1
      h3 Market
      div
        label(for='exchange').wrapper Exchange:
        .custom-select.button
          select(v-model='exchange')
            option(v-for='(market, e) in exchanges') {{ e }}
      div
        label(for='currency') Market:
        .custom-select.button
          select(v-model='market')
            option(v-for='market in markets') {{ market }}
    .grd-row-col-3-6.mx1
      range-picker(:config='watchConfig', v-on:range='emitConfig')
</template>

<script>

import _ from 'lodash'
import markets from './markets'
import rangePicker from './rangepicker.vue'

export default {
  data: () => {
    return {
      range: {},
      exchanges: markets,

      exchange: 'Poloniex',
      currency: 'BTC',
      asset: 'ETH',
      market: 'BTC/ETH'
    };
  },

  created: function() {
    this.emitConfig();
  },

  components: {
    rangePicker
  },
  computed: {
    markets: function() {
      return this.exchanges[ this.exchange ];
    },
    currency: function() {
      return _.first(this.market.split('/'));
    },
    asset: function() {
      return _.last(this.market.split('/'));
    },
    watchConfig: function() {
      return {
        watch: {
          exchange: this.exchange,
          currency: this.currency,
          asset: this.asset
        }
      }
    }
  },

  watch: {
    currency: function() { this.emitConfig() },
    market: function() { this.emitConfig() }
  },

  methods: {
    emitConfig: function(range) {
      if(range)
        this.range = range;
      let config = {
        backtest: {
          daterange: range,
        }
      };
      Object.assign(config, this.watchConfig);
      this.$emit('marketConfig', config);
    }
  }
}
</script>
</style>
