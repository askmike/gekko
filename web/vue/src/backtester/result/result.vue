<template lang='jade'>
  div
    result-summary(:result='result')
    chart(:data='result')
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
