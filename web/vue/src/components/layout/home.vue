<template lang='jade'>
  section.contain.grd-row
    .grd-row-col-3-6(v-html='left')
    .grd-row-col-3-6.txt--center
      img(src='./assets/gekko.jpg')
      p
        em The most valuable commodity I know of is information.
</template>

<script>
import marked from '../../tools/marked';

const left = marked(`

## Gekko

Gekko is a Bitcoin trading bot and backtesting platform that
connects to popular Bitcoin exchanges. It is written in javascript
and runs on nodejs.

[Find out more](https://gekko.wizb.it/).

*Gekko is 100% open source and free, if you paid for this you have been scammed.*

`);

export default {
  data: () => {
    return {
      left
    }
  }
}
</script>
