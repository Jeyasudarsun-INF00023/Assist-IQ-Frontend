<template>
  <div id="q-app">
    <router-view />
  </div>
</template>

<script setup>
console.log('App.vue is mounting...')
defineOptions({
  name: 'App'
});
</script>

<style>
body {
  font-family: 'Manrope', sans-serif;
}
</style>
