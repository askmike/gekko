<template lang='jade'>
div
  div
    label(for='exchange').wrapper Exchange:
    .custom-select.button
      select(v-model='exchange')
        option(v-for='(market, e) in exchanges') {{ e }}
  div
    label(for='currency') Currency:
    .custom-select.button
      select(v-model='currency')
        option(v-for='cur in currencies') {{ cur }}

  div
    label(for='asset') Asset:
    .custom-select.button
      select(v-model='asset')
        option(v-for='asst in assets') {{ asst }}

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
      currency: 'BTC',
      asset: 'USDT',
    };
  },

  created: function() {
    this.emitConfig();
  },
  computed: {
    markets: function() {
      return this.exchanges[ this.exchange ];
    },

    assets: function() {
      return markets[this.exchange][this.currency];
    },

    currencies: function() {
      return _.keys( markets[this.exchange] );
    },
    watchConfig: function() {
      return {
        watch: {
          exchange: this.exchange,
          currency: this.currency,
          currencies: this.currencies,
          asset: this.asset,
          assets: this.assets,
        }
      }
    }
  },

  watch: {
    currency: function() { this.emitConfig() },
    asset: function() { this.emitConfig() },
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
