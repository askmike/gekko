<template lang='jade'>
div
  #chartWrapper
    svg#chart(width='960', height='500')
</template>

<script>

import chart from '../../../d3/chart4'

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

      chart(this.data.candles, this.data.trades);
    },
    remove: function() {
      d3.select('#chart').html('');
    }
  },
  components: {
  }
}
</script>

<style>

#chart circle {
  clip-path: url(#clip);
}

#chart .zoom {
  cursor: move;
  fill: none;
  pointer-events: all;
}

#chart .line {
  fill: none;
  stroke: steelblue;
  stroke-width: 1.5px;
  clip-path: url(#clip);
}

/*#chart .price.line {
  stroke-width: 2.5px;
}*/

#chart circle.buy {
  fill: #7FFF00;
}

#chart circle.sell {
  fill: red;
}

</style>
