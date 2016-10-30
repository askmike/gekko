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
        p.bg--red.p1(v-if='rawStratParamsError') {{ rawStratParamsError.message }}
</template>

<script>

import _ from 'lodash'

export default {
  data: () => {
    return {
      strategies: [],

      strategy: 'MACD',
      candleSize: 60,
      historySize: 10,

      rawStratParams: '',
      rawStratParamsError: false,
      stratParams: {}
    };
  },
  created: function () {
    let to = 'http://localhost:3000/api/strategies';
    this.$http.get(to).then((response) => {
        this.strategies = response.body;
        this.rawStratParams = _.find(this.strategies, { name: this.strategy }).params;
        this.emitConfig();
    });
  },
  watch: {
    strategy: function(strat) {
      strat = _.find(this.strategies, { name: strat });
      this.rawStratParams = strat.params;

      this.emitConfig();
    },
    candleSize: function() { this.emitConfig() },
    historySize: function() { this.emitConfig() },
    rawStratParams: function() { this.emitConfig() }
  },
  computed: {
    config: function() {
      let config = {
        tradingAdvisor: {
          enabled: true,
          method: this.strategy,
          candleSize: this.candleSize,
          historySize: this.historySize
        }
      }

      config[this.strategy] = this.stratParams;

      return config;
    }
  },
  methods: {
    emitConfig: function() {
      this.parseParams();
      this.$emit('stratConfig', this.config);
    },
    parseParams: function() {
      try {
        this.stratParams = toml.parse(this.rawStratParams);
        this.rawStratParamsError = false;
      } catch(e) {
        this.rawStratParamsError = e;
        this.stratParams = {};
      }
    }
  }
}
</script>
</style>
