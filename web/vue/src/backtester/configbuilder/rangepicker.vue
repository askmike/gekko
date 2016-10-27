<template lang='jade'>
div
  h3 Daterange
  .txt--center(v-if='!scanned')
    a.w100--s.btn--blue.scan-btn(href='#', v-on:click.prevent='scan') scan available data
  .txt--center(v-if='scanned == "fetching"')
    p.scan-btn Scanning..
  div(v-if='scanned == true')
    label(for='exchange').wrapper Run simulation over:
    form.radio.grd
      div.grd-row(v-for='(range, i) in ranges').m1
        input.grd-row-col-1-6(type='radio', :name='i', v-model='selectedRange')
        label.grd-row-col-5-6(:for='i') {{ printRange(range) }}
    p
      em
        a(href='#', v-on:click.prevent='scan') rescan
    p want more data? 
      a(href='https://github.com/askmike/gekko/blob/stable/docs/Importing.md') see here!
</template>

<script>

import _ from 'lodash'
import moment from 'moment'

export default {
  props: ['config'],
  data: () => {
    var data = {
      scanned: false, // 'fetching', true
      ranges: [],
      selectedRange: {
        from: false,
        to: false
      }
    }

    return data;
  },
  methods: {
    scan: function() {
      this.scanned = 'fetching';
      let to = 'http://localhost:3000/api/scan';
      this.$http.post(to, this.config).then((response) => {
        this.scanned = true;
        this.ranges = response.body;
      });
    },
    printRange: function(range) {
      let fmt = mom => mom.format('MMM Do YY, HH:mm')
      let from = moment.unix(range.from);
      let to = moment.unix(range.to);
      let diff = moment.duration(to.diff(from)).humanize();
      return `${fmt(from)} to ${fmt(to)} (${diff})`;
    }
  },
  watch: {
    config: function() {
      console.log('aa');
      this.scanned = false;
    }
  },
  computed: {
    // prettyRanges: function() {
    //   return _.map(this.ranges, function(range) {
        // let fmt = mom => mom.format('MMMM Do YYYY HH:mm')
        // let from = moment.unix(range.from);
        // let to = moment.unix(range.to);
        // let diff = moment.duration(to.diff(from)).humanize();
        // return `from "${fmt(from)}" to "${fmt(to)}" (${diff})`;
    //   })
    // }
  },
}
</script>

<style>

.scan-btn {
  margin-top: 80px;
}

.radio label {
  margin-top: 0;
}

</style>
