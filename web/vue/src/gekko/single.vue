<template lang='jade'>
  div.contain.my2
    div(v-if='error')
      h1 Error
      p {{ error }}
    div(v-if='data && !error')
      h2 Running Gekko!
      p {{ data }}
      p Market: {{ data.watch.exchange }}:{{ data.watch.currency }}/{{ data.watch.asset }}
      .grd
        .grd-row
          .grd-row-col-2-6 Since:
          .grd-row-col-4-6 {{ fmt(since) }}
        .grd-row
          .grd-row-col-2-6 Received data until:
          .grd-row-col-4-6 {{ fmt(latest) }}
</template>

<script>

import spinner from '../global/blockSpinner.vue'
import { bus as ws } from '../tools/ws'
import { get } from '../tools/ajax'

export default {
  created: function() {
    get('liveGekkos', (error, response) => {
      this.data = _.find(response, {id: this.$route.params.id});
      if(!this.data)
        this.error = 'Not sure what Gekko this is..'
    });

    ws.$on('update', data => {
      if(data.gekko_id !== this.$route.params.id)
        return;

      this.handleWsMessage(data)
    });

    ws.$on('import_error', data => {
      if(data.import_id === this.$route.params.id)
        this.$router.push({path: '/import'});
    });
  },
  data: () => {
    return {
      error: false,
      data: false
    }
  },
  computed: {
    latest: function() {
      if(this.data)
        return this.mom(this.data.latest);
    },
    since: function() {
      if(this.data)
        return this.mom(this.data.startAt)
    }
  },
  methods: {
    handleWsMessage: function(event) {
      if(event.type === 'update')
        this.data.latest = moment.utc(event.latest);
      else if(event.type === 'startAt')
        this.data.since = moment.utc(event.startAt);
    },
    fmt: mom => { return mom.format('YYYY-MM-DD HH:mm:ss') },
    mom: str => moment.utc(str)
  }
}
</script>

<style>
</style>
