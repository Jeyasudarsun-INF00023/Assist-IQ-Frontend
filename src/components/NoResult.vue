<template>
  <div class="column items-center justify-center full-width q-pa-xl">
    <div ref="lottieContainer" class="lottie-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import lottie from 'lottie-web'

const props = defineProps({
  width: {
    type: String,
    default: '180px'
  },
  height: {
    type: String,
    default: '180px'
  }
})

const lottieContainer = ref(null)
let anim = null

onMounted(() => {
  anim = lottie.loadAnimation({
    container: lottieContainer.value,
    renderer: 'svg',
    loop: true,
    autoplay: true,
    path: '/no result.json' // Path to your lottie file in public/
  })
})

onBeforeUnmount(() => {
  if (anim) {
    anim.destroy()
  }
})
</script>

<style scoped>
.lottie-container {
  width: v-bind('props.width');
  height: v-bind('props.height');
}
.no-result-text {
  opacity: 0.8;
  letter-spacing: 0.5px;
}
</style>
