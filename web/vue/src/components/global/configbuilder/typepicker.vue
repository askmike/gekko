<template lang='jade'>
div
  h3 Type
  template
    label(for='type').wrapper What do you want to do with gekko?
    form.radio.grd
      div.grd-row(v-for='(type, i) in types').m1
        input.grd-row-col-1-6(type='radio', :value='i', v-model='selectedTypeIndex')
        label.grd-row-col-5-6(:for='i') {{ type }}
</template>

<script>

export default {
  created: function() {
    this.emitType();
  },
  data: () => {
    return {
      types: ['paper trader', 'market watcher', 'tradebot'],
      selectedTypeIndex: 0,
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
  },
  computed: {
    type: function() {
      return this.types[ this.selectedTypeIndex ];
    }
  }
}
</script>

<style>

.radio label {
  margin-top: 0;
}

</style>
