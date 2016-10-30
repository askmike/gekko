<template lang='jade'>
div
  #chartWrapper
    #chart
</template>

<script>

import chart from './chart'

export default {
  props: ['data'],
  data: () => {
    return {}
  },

  watch: {
    data: function() { this.render() }
  },

  created: function() { setTimeout( this.render, 100) },
  beforeDestroy: function() {
    this.remove();
  },

  methods: {
    render: function() {
      this.remove();
      chart(this.data.candles);
    },
    remove: function() {
      d3.select('#chart svg').remove();
    }
  },
  components: {
  }
}
</script>

<style>
#chartWrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
