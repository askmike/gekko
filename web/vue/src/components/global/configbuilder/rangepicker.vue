<template lang='jade'>
div
  h3 Daterange
  template(v-if='tab === "scan"')
    .txt--center(v-if='!scanned')
      a.w100--s.btn--primary.scan-btn(href='#', v-on:click.prevent='scan') Scan available data
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
    p.txt--center
      em
        a(href='#', v-on:click.prevent='tab = "manual"') Or manually set a daterange
  template(v-if='tab === "manual"')
    div
      label(for='from') From:
      input(v-model='from')
    div
      label(for='to') To:
      input(v-model='to')
    p.txt--center
    em
      a(href='#', v-on:click.prevent='tab = "scan"') Or scan for a daterange
</template>

<script>

import _ from 'lodash'
import { post } from '../../../tools/ajax'
// global moment

export default {
  props: ['config'],
  data: () => {
    return {
      scanned: false, // 'fetching', true
      ranges: [],
      selectedRangeIndex: -1,
      tab: 'scan',

      from: '',
      to: ''
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
      let fmt = mom => mom.format('YYYY-MM-DD HH:mm')
      let from = moment.unix(range.from);
      let to = moment.unix(range.to);
      let diff = moment.duration(to.diff(from)).humanize();
      return `${fmt(from)} to ${fmt(to)} (${diff})`;
    },
    fmtTs: (mom) => moment.unix(mom).utc(),
    fmt: (mom) => mom.utc().format(),
    emitRange: function(range) {
      this.$emit('range', {
        from: this.fmtTs(range.from),
        to: this.fmtTs(range.to)
      });
    },
    emitManualEntry: function() {
      if(this.from.length < '4' || this.from.length < '4')
        // this cannot possibly be a valid date
        return this.$emit('range', {})

      let from = moment.utc(this.from);
      let to = moment.utc(this.to);

      if(from.isValid() && to.isValid()) {
        this.$emit('range', {
          from: this.fmt(from),
          to: this.fmt(to)
        })
      } else {
        this.$emit('range', {});
      }
    },
    reset: function() {
      this.scanned = false;
      this.$emit('range', {})
    }
  },
  watch: {
    from: function() {
      this.emitManualEntry();
    },
    to: function() {
      this.emitManualEntry();
    },
    config: function() {
      this.reset();
    },
    tab: function() {
      this.reset();
    },
    selectedRangeIndex: function() {
      let selectedRange = this.ranges[this.selectedRangeIndex];
      if(selectedRange)
        this.emitRange(selectedRange);
    }
  }
}
</script>

<style>

.scan-btn {
  margin-top: 80px;
  margin-bottom: 30px;
}

.radio label {
  margin-top: 0;
}

</style>
