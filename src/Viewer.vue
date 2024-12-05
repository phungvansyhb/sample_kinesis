<template>
  <div v-if="!channel">
    <input class="w-[200px] h-10 border rounded"></input>
    <button @click="handleCreateChannel">Join channel</button>
  </div>

  <div  v-if="channel">
    <IvsPlayer :video-url="channel.channel.playbackUrl"/>
  </div>
</template>

<script setup lang="ts">

import IvsPlayer from "./components/IvsPlayer.vue";
import {ref} from "vue";
import {getIvsChannel} from "./helper/IVSHelper";
import {CreateChannelCommandOutput} from "@aws-sdk/client-ivs";

const channelName = ref('')
const channel = ref<CreateChannelCommandOutput|null>(null)

async function handleCreateChannel(){
  channel.value = await getIvsChannel(channelName.value)
}
</script>

<style scoped>

</style>