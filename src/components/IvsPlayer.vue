<template>
  <div>
    <div ref="videoContainer" class="video-container"></div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import IVSPlayer from 'amazon-ivs-player';


const isSupport = IVSPlayer.isPlayerSupported
const videoContainer = ref<HTMLDivElement | null>(null);
let player: any;

const props = defineProps<{videoUrl : string}>()

onMounted(() => {
  if (videoContainer.value) {
    player = IVSPlayer.create({wasmBinary : '',wasmWorker : ''});
    player.attachMediaElement(videoContainer.value);
    player.load(props.videoUrl);
    player.play();
  }
});

onBeforeUnmount(() => {
  if (player) {
    player.pause();
    player.destroy();
  }
});
</script>

<style scoped>
.video-container {
  width: 100%;
  height: auto;
}
</style>