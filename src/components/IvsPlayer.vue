<template>
  <div>
    <video id="videoContainer" class="w-[max(720px,80vw)] aspect-video bg-gray-50"  autoplay playsinline controls></video>
    <button @click="reload">Reload</button>
  </div>

</template>

<script lang="ts" setup>
import {ref, onMounted, onBeforeUnmount} from 'vue';
import {useScriptTag} from "@vueuse/core";
import {Player , PlayerEventType} from 'amazon-ivs-player';

const { scriptTag , load : loadIVSPlayer, unload : unloadIVSPlayer } = useScriptTag(
    'https://player.live-video.net/1.34.1/amazon-ivs-player.min.js',
    () => {
    },
    { manual: true },
)

const props = defineProps<{videoUrl : string}>()

const player = ref<Player|null>(null)

function reload(){
    player.value.load(props.videoUrl)
    player.value.play();
}

onMounted(async () => {
  await loadIVSPlayer()
  //@ts-ignore
  if (IVSPlayer.isPlayerSupported) {
    //@ts-ignore
    player.value = IVSPlayer.create();
    player.value.attachHTMLVideoElement(document.getElementById('videoContainer') as HTMLVideoElement);
    player.value.load(props.videoUrl);
    player.value.play();
    player.value.addEventListener(PlayerEventType.ERROR, ()=>{
      window.alert("chanel not found, please reload")
    })
  }

});

onBeforeUnmount(async () => {
  if (player) {
    player.value.delete();
  }
  unloadIVSPlayer()
});

</script>

<style scoped>

</style>