<template lang='jade'>
  div(v-if='active')
    #modal-background(v-on:click='disable')
    #modal.modal
      .modal-guts
        p this is a modal!
</template>

<script>

import marked from '../../tools/marked'

export default {
  data: () => {
    return {
      active: false
    }
  },
  methods: {
    clearMessages: function() {

    },
    disable: function() {
      this.active = false;
    },
    enable: function() {
      this.active = true;
    },
    gekkoCrashed: gekko => {
      // only 2 types supported
      let type = gekko.type === 'watcher' ? 'Market watcher' : 'Strat runner';
      return marked(`
        The ${type} ${gekko.id} crashed because:

        ${gekko.error}
      `)
    }
  }
}
</script>

<style>
#modal-background {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;

  background-color: black;
  opacity: 0.5
}

.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 600px;
  min-height: 300px;
  background-color: white;
}

.modal-guts {

  /* other stuff we already covered */

  /* cover the modal */
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  /* spacing as needed */
  padding: 20px 50px 20px 20px;

  /* let it scroll */
  overflow: auto;
  
}
</style>
