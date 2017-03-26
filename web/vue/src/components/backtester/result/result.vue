<template lang='jade'>
  div
    .hr.contain
    div.contain
      h3 Backtest result
    result-summary(:report='result.report')
    .hr.contain
    chart(:data='result', height='500')
</template>

<script>
import resultSummary from './summary.vue'
import chart from './chartWrapper.vue'

export default {
  props: ['result'],
  data: () => {
    return {}
  },
  methods: {
    
  },
  components: {
    resultSummary,
    chart
  }
}
</script>

<style>
</style>
