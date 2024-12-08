<template>
  <div v-if="channel" class="flex gap-2">
    <IvsPlayer :video-url="channel?.channel?.playbackUrl" class="aspect-video w-[max(720px,80vw)] border rounded-lg flex-grow" />
    <Chat :chatARN="chatArn as string" :is-host="false"/>
  </div>
</template>

<script setup lang="ts">

import IvsPlayer from "./components/IvsPlayer.vue";
import {onMounted, ref} from "vue";
import {getIvsChannel} from "./helper/IVSHelper";
import {CreateChannelCommandOutput} from "@aws-sdk/client-ivs";
import Chat from "./components/Chat.vue";
import {useRoute} from "vue-router";

const route = useRoute()
const {channelArn , chatArn } = route.query

const channel = ref<CreateChannelCommandOutput|null>(null)

onMounted(async () => {
  try{
    channel.value = await getIvsChannel(channelArn as string)
  }catch(e){
    console.log(e)
  }
})

</script>

<style scoped>

</style>