<template lang='jade'>
.grd-row-col-3-6
  table.p1
    tr
      th amount of trades
      td {{ report.trades }}
    tr
      th sharpe ratio
      td {{ round2(report.sharpe) }}
    tr
      th start balance
      td {{ round(report.startBalance) }} {{ report.currency }}
    tr
      th final balance
      td {{ round(report.balance) }} {{ report.currency }}
    tr
      th simulated profit

  .big.txt--right.price(:class='profitClass') {{ round(report.relativeProfit) }}%

</template>

<script>

export default {
  props: ['report'],
  methods: {
    round2: n => (+n).toFixed(2),
    round: n => (+n).toFixed(5)
  },
  computed: {
    profitClass: function() {
      if(this.report.relativeProfit > 0)
        return 'profit'
      else
        return 'loss'
    }
  }
}
</script>

<style>
.summary td {
  text-align: right;
}

.big {
  font-size: 1.3em;
  width: 80%;
}

.summary table {
  width: 80%;
}

.price.profit {
  color: #7FFF00;
}

.price.loss {
  color: red;
}

</style>
