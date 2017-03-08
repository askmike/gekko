<template lang='jade'>
div
  h3 Select a dataset
  .txt--center.my2(v-if='datasetScanstate === "idle"')
    a.w100--s.btn--blue.scan-btn(href='#', v-on:click.prevent='scan') scan available data
  .txt--center.my2(v-if='datasetScanstate === "scanning"')
    spinner
  .my2(v-if='datasetScanstate === "scanned"')
    table.full
      thead
        tr
          th 
          th exchange
          th currency
          th asset
          th from
          th to
          th duration
      tbody
        tr(v-for='(set, i) in datasets')
          td.radio
            input(type='radio', name='dataset', :value='i', v-model='setIndex')
          td {{ set.exchange }}
          td {{ set.currency }}
          td {{ set.asset }}
          td {{ fmt(set.from) }}
          td {{ fmt(set.to) }}
          td {{ humanizeDuration(set.to.diff(set.from)) }}
</template>

<script>

import { post } from '../../../tools/ajax'
import spinner from '../../global/blockSpinner.vue'
import dataset from '../../global/mixins/dataset'

export default {
  components: {
    spinner
  },
  data: () => {
    return {
      setIndex: -1
    };
  },
  mixins: [ dataset ],
  methods: {
    humanizeDuration: (n) => {
      return window.humanizeDuration(n, {largest: 4});
    },
    fmt: mom => mom.format('YYYY-MM-DD HH:mm')
  },
  computed: {
    set: function() {
      return this.datasets[this.setIndex];
    }
  },
  watch: {
    set: function(val) {
      if(!val)
        return;

      this.$emit('dataset', val);
    }
  }
}
</script>
<style>
td.radio {
  width: 45px;
}
</style>
