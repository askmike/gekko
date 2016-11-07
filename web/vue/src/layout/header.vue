<template lang='jade'>
  div
    header.bg--off-white.grd
      .contain.grd-row
        h3.py1.px2.col-2 Gekko UI
    nav.bg--light-gray
      .menu.contain
        router-link(to='/').py1 Home
        router-link(to='/import').py1 Import data
        router-link(to='/backtest').py1 Backtest
        router-link(to='/live-gekko').py1 Live Gekko
        a(href='https://gekko.wizb.it/docs', target='_blank').py1 Documentation

</template>

<script>
export default {}
</script>

<style>
.menu {
  display: flex;
  width: 100%;
  flex-direction: row;
  margin-top: 0;
  margin-bottom: 2rem;
}

.menu a {
  flex: 1 1 100%;
  display: block;
  text-align: center;
  text-decoration: none;
}

.menu a:hover {
  background-color: rgba(250,250,250,.99);
}
</style>
