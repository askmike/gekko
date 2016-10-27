<template lang='jade'>
// config.tradingAdvisor
.grd
  .grd-row
    .grd-row-col-3-6.px1
      h3 Strategy
      div
        label(for='strat').wrapper Strategy:
        .custom-select.button
          select(v-model='strategy')
            option(v-for='strat in strategies') {{ strat.name }}
      div
        label(for='candleSize') Candle Size (in minutes):
        input(v-model='candleSize')
      div
        label(for='historySize') History Size (in {{ candleSize }} minute candles):
        input(v-model='historySize')
    .grd-row-col-2-6.px1
      div
        h3 Parameters
        p {{ strategy }} Parameters:
        textarea.params(v-model='rawStratParams')
</template>

<script>

import _ from 'lodash'
import markets from './markets'
import rangePicker from './rangepicker.vue'

export default {
  data: () => {
    return {
      strategies: [],

      strategy: 'MACD',
      candleSize: 60,
      historySize: 10,
      rawStratParams: '',
      rawStratParamsError: ''
    };
  },
  created: function () {
    let to = 'http://localhost:3000/api/strategies';
    this.$http.get(to).then((response) => {
        this.strategies = response.body;
        this.rawStratParams = _.find(this.strategies, { name: this.strategy}).params;
    });
  },
  watch: {
    strategy: function(strat) {
      strat = _.find(this.strategies, { name: strat});
      this.rawStratParams = strat.params;
    }
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
    config: function() {
      return {
        watch: {
          exchange: this.exchange,
          currency: this.currency,
          asset: this.asset
        }
      }
    }
  },
  methods: {
  }
}
</script>
</style>
