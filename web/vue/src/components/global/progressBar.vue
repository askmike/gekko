// http://stackoverflow.com/questions/7190898/progress-bar-with-html-and-css

<template lang='jade'>
.progressbarWrapper(v-if='progress')
  p {{ round(progress) }}%
  .progressbar
    div(:style='{width: progress + "%"}')
</template>

<script>
export default {
  props: ['progress'],
  methods: {
    round: n => (+n).toFixed(2)
  }
}
</script>

<style>
.progressbarWrapper p {
  text-align: center;
}

.progressbar {
  background-color: rgba(216,216,216,.99);
  border-radius: 13px; /* (height of inner div) / 2 + padding */
  padding: 3px;
}

.progressbar > div {
   background-color: orange;
   height: 20px;
   border-radius: 10px;
}
</style>