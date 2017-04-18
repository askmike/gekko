// http://stackoverflow.com/questions/7190898/progress-bar-with-html-and-css

<template lang='jade'>
.progressbarWrapper
  p {{ round(progress) }}%
  .progressbar
    div(:style='{width: progress + "%"}')
</template>

<script>
export default {
  props: ['progress'],
  methods: {
    round: n => {console.log(n);return(+n).toFixed(3)}
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