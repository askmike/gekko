<template lang='jade'>
div
  .mx1
    label(for='exchange').wrapper Exchange:
    .custom-select.button
      select(v-model='exchange')
        option(v-for='(market, e) in exchanges') {{ e }}
  .grd-row
    .grd-row-col-3-6.mx1
      label(for='currency') Currency:
      .custom-select.button
        select(v-model='currency')
          option(v-for='cur in currencies') {{ cur }}
    .grd-row-col-3-6.mx1
      label(for='asset') Asset:
      .custom-select.button
        select(v-model='asset')
          option(v-for='asst in assets') {{ asst }}
</template>

<script>

import _ from 'lodash'
import rangePicker from './rangepicker.vue'
import rangeCreator from './rangecreator.vue'
import { get } from '../../../tools/ajax'

export default {
  props: ['has'],
  data: () => {
    return {
      exchanges: null,

      // defaults:
      exchange: 'poloniex',
      currency: 'USDT',
      asset: 'BTC',
    };
  },
  created: function() {
    get('exchanges', (err, data) => {
        var exchangesRaw = data;
        var exchanegsTemp = {};

        exchangesRaw.forEach(e => {
          exchanegsTemp[e.slug] = exchanegsTemp[e.slug] || {};

          e.markets.forEach( pair => {
            let [ currency, asset ] = pair['pair'];
            exchanegsTemp[e.slug][currency] = exchanegsTemp[e.slug][currency] || [];
            exchanegsTemp[e.slug][currency].push( asset );
          });
        });

        this.exchanges = exchanegsTemp;
        this.emitConfig();
    });
  },
  computed: {
    markets: function() {
      return this.exchanges ? this.exchanges[ this.exchange ] : null;
    },

    assets: function() {
      return this.exchanges ? this.exchanges[this.exchange][this.currency] : null;
    },

    currencies: function() {
      return this.exchanges ? _.keys( this.exchanges[this.exchange] ) : null;
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
