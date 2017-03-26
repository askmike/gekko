<template lang='jade'>
div
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
</template>

<script>

import _ from 'lodash'
import markets from './markets'
import rangePicker from './rangepicker.vue'
import rangeCreator from './rangecreator.vue'

export default {
  props: ['has'],
  data: () => {
    return {
      exchanges: markets,

      // defaults:
      exchange: 'poloniex',
      market: 'USDT/BTC'
    };
  },

  created: function() {
    this.emitConfig();
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
    emitConfig: function() {
      this.$emit('market', this.watchConfig);
    }
  }
}
</script>
</style>
