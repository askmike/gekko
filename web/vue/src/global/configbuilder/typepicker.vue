<template lang='jade'>
div
  h3 Typepicker
  template
    label(for='type').wrapper Type of Gekko:
    form.radio.grd
      div.grd-row().m1
        input.grd-row-col-1-6(type='radio', name='type', checked)
        label.grd-row-col-5-6(for='type') {{ type }}

    em (Only paper trader supported for now)
</template>

<script>

export default {
  created: function() {
    this.emitType();
  },
  data: () => {
    return {
      type: 'paper-trader', // 'market-watcher'
    }
  },
  methods: {
    emitType: function() {
      this.$emit('type', this.type);
    }
  },
  watch: {
    type: function() {
      this.emitType();
    }
  }
}
</script>

<style>

.radio label {
  margin-top: 0;
}

</style>
