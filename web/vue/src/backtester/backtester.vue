<template lang='jade'>
  div
    h2.contain Backtest
    .hr.contain
    config-builder(v-on:config='check')
    div(v-if='backtestable')
      .hr.contain
      .txt--center
        a.w100--s.my1.btn--blue(href='#', v-if='backtestState !== "fetching"', v-on:click.prevent='run') Backtest
        div(v-if='backtestState === "fetching"').scan-btn
          p Running backtest..
          spinner
    result(v-if='backtestResult && backtestState === "fetched"', :result='backtestResult')
</template>

<script>
import configBuilder from './configbuilder/configbuilder.vue'
import result from './result/result.vue'
import { post } from '../tools/ajax'
import spinner from '../global/blockSpinner.vue'

export default {
  data: () => {
    return {
      backtestable: false,
      backtestState: 'idle',
      backtestResult: false,
      config: false,
    }
  },
  methods: {
    check: function(config) {
      this.config = config;

      if(!config.valid)
        return this.backtestable = false;

      this.backtestable = true;
    },
    run: function() {
      this.backtestState = 'fetching';
      post('backtest', this.config, (error, response) => {
        this.backtestState = 'fetched';
        this.backtestResult = response;
      });
    },

    onWSa: function(message) {
      console.log('backtester onWSa', message);
    }
  },
  components: {
    configBuilder,
    result,
    spinner
  }
}
</script>

<style>
.contain {
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;
}
</style>
