<template lang='jade'>
div
  h3 Daterange
  .txt--center(v-if='!scanned')
    a.w100--s.btn--blue.scan-btn(href='#', v-on:click.prevent='scan') scan available data
  .txt--center(v-if='scanned == "fetching"')
    p.scan-btn Scanning..
  template(v-if='scanned == true')
    template(v-if='ranges.length === 0')
      p
        strong Unable to find any local data, do you have local data available for
          | "{{ config.watch.exchange }}:{{ config.watch.currency }}/{{ config.watch.asset }}"?
    template(v-else)
      label(for='exchange').wrapper Run simulation over:
      form.radio.grd
        div.grd-row(v-for='(range, i) in ranges').m1
          input.grd-row-col-1-6(type='radio', :value='i', v-model='selectedRangeIndex')
          label.grd-row-col-5-6(:for='i') {{ printRange(range) }}
    p
      em
        a(href='#', v-on:click.prevent='scan') rescan
    p want more data? 
      a(href='https://github.com/askmike/gekko/blob/stable/docs/Importing.md') see here!
</template>

<script>

import _ from 'lodash'
import { post } from '../../tools/ajax'

export default {
  props: ['config'],
  data: () => {
    return {
      scanned: false, // 'fetching', true
      ranges: [],
      selectedRangeIndex: -1
    }
  },
  methods: {
    scan: function() {
      this.scanned = 'fetching';
      this.selectedRangeIndex = -1;  
      post('scan', this.config, (err, response) => {
        this.scanned = true;
        this.ranges = response;
        this.selectedRangeIndex = 0;
      });
    },
    printRange: function(range) {
      let fmt = mom => mom.format('MMM Do YY, HH:mm')
      let from = moment.unix(range.from);
      let to = moment.unix(range.to);
      let diff = moment.duration(to.diff(from)).humanize();
      return `${fmt(from)} to ${fmt(to)} (${diff})`;
    },
    fmt: function(mom) {
      return moment.unix(mom).utc().format();
    }
  },
  watch: {
    config: function() {
      this.scanned = false;
    },
    selectedRangeIndex: function() {
      let selectedRange = this.ranges[this.selectedRangeIndex];
      if(!selectedRange)
        return;

      this.$emit('range', {
        from: this.fmt(selectedRange.from),
        to: this.fmt(selectedRange.to)
      });
    }
  }
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
