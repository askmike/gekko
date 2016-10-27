<script>

import top from './layout/header.vue'
import bottom from './layout/footer.vue'

export default {
  name: 'app',
  components: {
    top,
    bottom
  }
}
</script>

<template lang='jade'>
  #app
    top
    .fill
      router-view.view
    bottom
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

/**/
</style>
