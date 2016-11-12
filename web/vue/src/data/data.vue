<template lang='jade'>
  .contain
    .text(v-html='intro')
    .hr
    h2 Available datasets
    .txt--center.my2(v-if='!datasets.length')
      a.w100--s.btn--blue.scan-btn(href='#', v-on:click.prevent='scan') scan available data
    .my2
      h2 Import more data
      p.text You can easily import more market data directly from the exchange using the importer.
      router-link(to='/data/importer') Go to the importer.

</template>

<script>

import marked from '../tools/marked'

let intro = marked(`

## Local data

Gekko needs local market data in order to backtest strategies. The local
data can also be used in a warmup period when running a strategy against a
live market.

`)

export default {
  data: () => {
    return {
      intro,
      datasets: []
    }
  }
}
</script>

<style>
</style>
