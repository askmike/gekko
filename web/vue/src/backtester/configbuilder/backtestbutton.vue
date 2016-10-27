<template lang='jade'>
  .txt--center
    a.w100--s.my1.btn--blue(href='#', v-on:click.prevent='onClick') Backtest
</template>

<script>
export default {
  data: () => {
    var data = {}

    return data;
  },
  methods: {
    onClick: function() {
      this.$emit('click')
    }  
  }
}
</script>
