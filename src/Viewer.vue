<template>
  <div v-if="channel" class="flex gap-2">
    <IvsPlayer :video-url="channel?.channel?.playbackUrl" class="aspect-video w-[max(720px,80vw)] border rounded-lg flex-grow" />
<!--    <Chat/>-->
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

const channel = ref<CreateChannelCommandOutput|null>(null)

onMounted(async () => {
  channel.value = await getIvsChannel(route.params.channelArn as string)
})

</script>

<style scoped>

</style>