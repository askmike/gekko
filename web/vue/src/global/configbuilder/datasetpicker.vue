<template lang='jade'>
div
  h3 Select a dataset
  .txt--center.my2(v-if='scanstate === "idle"')
    a.w100--s.btn--blue.scan-btn(href='#', v-on:click.prevent='scan') scan available data
  .txt--center.my2(v-if='scanstate === "scanning"')
    spinner
  .my2(v-if='scanstate === "scanned"')
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

import { post } from '../../tools/ajax'
import spinner from '../../global/blockSpinner.vue'

export default {
  components: {
    spinner
  },
  data: () => {
    return {
      datasets: [],
      scanstate: 'idle',
      setIndex: -1
    };
  },
  methods: {
    scan: function() {
      this.scanstate = 'scanning';

      post('scansets', {}, (error, response) => {
        this.scanstate = 'scanned';

        let sets = [];

        response.forEach(market => {
          market.ranges.forEach(range => {
            sets.push({
              exchange: market.exchange,
              currency: market.currency,
              asset: market.asset,
              from: moment.unix(range.from).utc(),
              to: moment.unix(range.to).utc()
            });
          });
        });

        // for now, filter out sets smaller than 3 hours..
        sets = sets.filter(set => {
          if(set.to.diff(set.from, 'hours') > 2)
            return true;
        });

        sets = sets.sort((a, b) => {
          let adiff = a.to.diff(a.from);
          let bdiff = b.to.diff(b.from);

          if(adiff < bdiff)
            return -1;

          if(adiff > bdiff)
            return 1;

          return 0;
        }).reverse();

        this.datasets = sets;
      })
    },
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
