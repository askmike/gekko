<template lang='jade'>
div
  #chartWrapper
    #chart
</template>

<script>

import chart from '../../d3/chart3'

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

      console.log(this.data);

      chart(this.data.candles, this.data.trades);
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

text {
    fill: #000;
}

path.candle {
    stroke: #000000;
}

path.candle.body {
    stroke-width: 0;
}

path.candle.up {
    fill: #00AA00;
    stroke: #00AA00;
}

path.candle.down {
    fill: #FF0000;
    stroke: #FF0000;
}

rect.pane {
    cursor: move;
    fill: none;
    pointer-events: all;
}

path.tradearrow {
    stroke: none;
}

path.tradearrow.buy {
    fill: #0000FF;
}

path.tradearrow.buy-pending {
    fill-opacity: 0.2;
    stroke: #0000FF;
    stroke-width: 1.5;
}

path.tradearrow.sell {
    fill: #9900FF;
}

.tradearrow path.highlight {
    fill: none;
    stroke-width: 2;
}

.tradearrow path.highlight.buy,.tradearrow path.highlight.buy-pending {
    stroke: #0000FF;
}

.tradearrow path.highlight.buy-pending {
    fill: #0000FF;
    fill-opacity: 0.3;
}

.tradearrow path.highlight.sell {
    stroke: #9900FF;
}

</style>
