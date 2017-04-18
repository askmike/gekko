<template lang='jade'>
  div.contain.my2
    div(v-if='data && !data.done')
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
      .contain
        progressBar(:progress='progress')
      p 
        em (you don't have to wait until the import is done,
          | you can already start 
          router-link(to='/backtest') backtesting
          | ).
    div(v-if='data && data.done').txt--center
      h2 Import done
      p 
        | Go and 
        router-link(to='/backtest') backtest
        |  with your new data!
    div(v-if='!data').txt--center
      h2 ERROR: Uknown import
      p 
        I don't know this import..
</template>

<script>

import progressBar from '../../global/progressBar.vue'

export default {
  components: {
    progressBar
  },
  computed: {
    data: function() {
      return _.find(
        this.$store.state.imports,
        { id: this.$route.params.id }
      );
    },
    latest: function() {
      if(this.data)
        return this.mom(this.data.latest);
    },
    fromEndMs: function() {
      if(this.data)
        return this.to.diff(this.latest);
    },
    fromEnd: function() {
      if(!this.latest)
        return 'LOADING'

      return humanizeDuration(this.fromEndMs);
    },
    from: function() {
      if(this.data)
        return this.mom(this.data.from)
    },
    to: function() {
      if(this.data)
        return this.mom(this.data.to)
    },
    timespan: function() {
      if(this.data)
        return this.to.diff(this.from)
    },
    progress: function() {
      if(!this.data)
        return;

      const current = this.timespan - this.fromEndMs;
      return 100 * current / this.timespan;
    }
  },
  methods: {
    fmt: mom => { return mom.format('YYYY-MM-DD HH:mm:ss') },
    mom: str => moment.utc(str)
  }
}
</script>

<style>
</style>
