<template lang='jade'>
.config-builder.my2
  market-picker.contain
  .hr.contain
  strat-picker.contain
</template>

<script>

import marketPicker from './marketpicker.vue'
import stratPicker from './stratpicker.vue'
  

export default {
  data: () => {
    return {}
  },

  components: {
    marketPicker,
    stratPicker
  },
  methods: {}
}
</script>

<style>

input {
  background: none;
  margin-top: 0.5em;
}

.params {
  min-height: 235px;
  line-height: 1.3em;
}

.hr {
  margin-top: 2rem;
  margin-bottom: 2rem;
  height: 10px;
  background-color: rgba(250,250,250,.99);
}
</style>
