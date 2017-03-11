<script>

import top from './components/layout/header.vue'
import bottom from './components/layout/footer.vue'
import modal from './components/layout/modal.vue'

export default {
  name: 'app',
  components: {
    top,
    bottom,
    modal
  }
}
</script>

<template lang='jade'>
  #app
    top
    .fill
      router-view.view
    bottom
    modal
</template>

<style>

#app {
  display: flex;
  min-height: 100vh;
  flex-direction: column;
}

.fill {
  flex: 1;
}

.text {
  max-width: 500px;
}

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
