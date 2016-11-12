<template lang='jade'>
  div.contain.my2
    div(v-if='!done && data')
      h2 Importing data..
      p Market: {{ data.watch.exchange }}:{{ data.watch.currency }}/{{ data.watch.asset }}
      .grd
        .grd-row
          .grd-row-col-2-6 From:
          .grd-row-col-4-6 {{ fmt(from) }}
        .grd-row
          .grd-row-col-2-6 To:
          .grd-row-col-4-6 {{ fmt(to) }}
        .grd-row
          .grd-row-col-2-6 Imported data until:
          .grd-row-col-4-6 {{ fmt(latest) }}
        .grd-row
          .grd-row-col-2-6 To go:
          .grd-row-col-4-6 {{ fromEnd }}
      p 
        em (you don't have to wait until the import is done,
          | you can already start 
          router-link(to='/backtest') backtesting
          | ).
    div(v-if='done').txt--center
      h2 Import done
      p 
        | Go and 
        router-link(to='/backtest') backtest
        |  with your new data!
</template>

<script>

import spinner from '../../global/blockSpinner.vue'
import { bus as ws } from '../../tools/ws'
import { get } from '../../tools/ajax'

export default {
  created: function() {
    get('imports', (error, response) => {
      this.data = _.find(response, {id: this.$route.params.id});
      if(this.data === undefined)
        this.done = true;
    });

    ws.$on('import_update', data => {
      if(data.import_id !== this.$route.params.id)
        return;

      this.handleWsMessage(data)
    });

    ws.$on('import_error', data => {
      if(data.import_id === this.$route.params.id)
        this.$router.push({path: '/import'});
    });
  },
  components: {
    spinner
  },
  data: () => {
    return {
      done: false,
      data: false, // I cannot name this "_import" for some reason...
    }
  },
  computed: {
    latest: function() {
      if(this.data)
        return this.mom(this.data.latest);
    },
    fromEnd: function() {
      if(!this.latest)
        return 'LOADING'

      let diff = this.to.diff(this.latest);
      return humanizeDuration(diff);
    },
    from: function() {
      if(this.data)
        return this.mom(this.data.from)
    },
    to: function() {
      if(this.data)
        return this.mom(this.data.to)
    }
  },
  methods: {
    handleWsMessage: function(data) {
      if(data.done)
        return this.done = true;

      if(this.data)
        this.data.latest = moment.utc(data.latest);
    },
    fmt: mom => { return mom.format('YYYY-MM-DD HH:mm:ss') },
    mom: str => moment.utc(str)
  }
}
</script>

<style>
</style>
