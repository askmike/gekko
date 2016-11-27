<template lang='jade'>
  .contain.py2
    .text(v-html='text')
    .hr
    h2 Running gekkos
    .text(v-if='!gekkos.length')
      p You currently do not have any Gekkos running.
    table.full(v-if='gekkos.length')
      thead
        tr
          th exchange
          th currency
          th asset
          th started at
          th last update
          th duration
          th type
      tbody
        tr.clickable(v-for='gekko in gekkos', v-on:click='$router.push({path: `live-gekkos/gekko/${gekko.id}`})')
          td {{ gekko.watch.exchange }}
          td {{ gekko.watch.currency }}
          td {{ gekko.watch.asset }}
          td {{ fmt(gekko.startAt) }}
          td {{ fmt(gekko.latest) }}
          td {{ humanizeDuration(gekko.latest.diff(gekko.startAt)) }}
          td {{ gekko.type }}
    .hr
    h2 Start a new Gekko
    router-link(to='/live-gekkos/new') start a new gekko!
</template>

<script>

import { get } from '../../tools/ajax'
import marked from '../../tools/marked';
// global moment
// global humanizeDuration

const text = marked(`

## Live Gekko

You can use Gekko to run you strategy against the live market!

*Note: only paper trading is supported for now.*

`);

export default {
  created: function() {
    get('liveGekkos', (error, response) => {
      this.gekkos = _.map(response, g => {
        g.startAt = moment.utc(g.startAt);
        g.latest = moment.utc(g.latest);
        return g;
      });
    });
  },
  data: () => {
    return {
      text,
      gekkos: []
    }
  },
  methods: {
    humanizeDuration: (n) => window.humanizeDuration(n),
    fmt: mom => mom.format('YYYY-MM-DD HH:mm')
  }
}
</script>

<style>
tr.clickable {
  cursor: pointer;
}
tr.clickable:hover {
  background: rgba(216,216,216,.99);
}
</style>
