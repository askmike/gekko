<template lang='jade'>
  div(v-if='active')
    #modal-background
    #modal.modal
      .modal-guts(v-html='content')
</template>

<script>

import marked from '../../tools/marked';

const messages = {
  disconnected: marked(`

## Disconnected

Something happened to either Gekko or the connection.
Please check the terminal where Gekko is running or
your network connection.

  `)
}

export default {
  computed: {
    active: function() {
      return !this.$store.state.warnings.connected;
    },
    content: function() {
      if(!this.$store.state.warnings.connected)
        return messages.disconnected;
      return '';
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
