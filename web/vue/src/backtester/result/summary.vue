<template lang='jade'>
div.contain

  .grd-row.summary
    .grd-row-col-3-6
      table.p1
        tr
          th start time
          td {{ report.startTime }}
        tr
          th end time
          td {{ report.endTime }}
        tr
          th timespan
          td {{ report.timespan }}
        tr
          th start price
          td {{ round(report.startPrice) }} {{ report.currency }}
        tr
          th end price
          td {{ round(report.endPrice) }} {{ report.currency }}
        tr
          th buy and hold profit
          td {{ round(report.buynhold) }}%

    .grd-row-col-3-6
      table.p1
        tr
          th amount of trades
          td {{ report.trades }}
        tr
          th start balance
          td {{ round(report.startBalance) }} {{ report.currency }}
        tr
          th final balance
          td {{ round(report.balance) }} {{ report.currency }}
        tr
          th simulated profit

      .big.txt--right {{ round(report.relativeProfit) }}% ({{ round(report.profit) }} {{ report.currency }})

</template>

<script>

export default {
  props: ['report'],
  methods: {
    round: n => (+n).toFixed(5)
  }
}
</script>

<style>
.summary td {
  text-align: right;
}

.big {
  font-size: 1.7em;
  width: 80%;
}

.summary table {
  width: 80%;
}
</style>
