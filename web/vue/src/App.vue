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

.btn--primary {
  display: inline-block;
  margin-right: 12px;
  margin-bottom: 12px;
  height: 40px;
  padding: 0 18px;
  border-radius: 4px;
  background-color: #3498db;
  text-shadow: 0 1px 3px rgba(36,180,126,.4);
  box-shadow: 0 4px 6px rgba(50,50,93,.11), 0 1px 3px rgba(0,0,0,.08);
  color: #fff;
  text-decoration: none;
  line-height: 40px;
  transition: transform 250ms;
}

.btn--primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 7px 14px rgba(50,50,93,.1), 0 3px 6px rgba(0,0,0,.08);
  background-color: #3498db;
  color: #fff;
  text-decoration: none;
}

.btn--primary:active,
.btn--primary:focus {
  background-color: #3498db;
  color: #fff;
  text-decoration: none;
}

.btn--primary:active {
  transform: translateY(1px);
}
</style>
