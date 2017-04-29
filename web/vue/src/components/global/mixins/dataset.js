import { post } from '../../../tools/ajax'

var mixin = {
  data: () => {
    return {
      datasets: [],
      datasetScanstate: 'idle',
      unscannableMakets: []
    }    
  },
  methods: {
    scan: function() {
      this.datasetScanstate = 'scanning';

      post('scansets', {}, (error, response) => {
        this.datasetScanstate = 'scanned';

        this.unscannableMakets = response.errors;

        let sets = [];

        response.datasets.forEach(market => {
          market.ranges.forEach((range, i) => {
            sets.push({
              exchange: market.exchange,
              currency: market.currency,
              asset: market.asset,
              from: moment.unix(range.from).utc(),
              to: moment.unix(range.to).utc(),
              id: market.exchange + market.asset + market.currency + i
            });
          });
        });

        // for now, filter out sets smaller than 3 hours..
        sets = sets.filter(set => {
          if(set.to.diff(set.from, 'hours') > 2)
            return true;
        });

        sets = sets.sort((a, b) => {
          let adiff = a.to.diff(a.from);
          let bdiff = b.to.diff(b.from);

          if(adiff < bdiff)
            return -1;

          if(adiff > bdiff)
            return 1;

          return 0;
        }).reverse();

        this.datasets = sets;
      })
    }
  }
}

export default mixin;