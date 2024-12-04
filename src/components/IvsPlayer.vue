<template>
  <div>
    <div ref="videoContainer" class="video-container"></div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { createPlayer } from 'amazon-ivs-player';

const videoContainer = ref<HTMLDivElement | null>(null);
let player: any;

const videoUrl = 'https://your-ivs-url.m3u8'; // Thay thế bằng URL của bạn

onMounted(() => {
  if (videoContainer.value) {
    player = createPlayer({
      autoplay: true
    });
    player.attachMediaElement(videoContainer.value);
    player.load(videoUrl);
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