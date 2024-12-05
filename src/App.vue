<template>
  <div v-if="!channel">
    <input class="w-[200px] h-10 border rounded"></input>
    <button @click="handleCreateChannel">Create channel</button>
  </div>

  <div  v-if="channel">
    <BroadcastDevice :ingest-endpoint="channel.channel.ingestEndpoint" :streamKey="channel.streamKey.arn"/>
  </div>

</template>

<script lang="ts" setup>
import {ref} from "vue";
import {createIvsChannel} from "./helper/IVSHelper";
import {CreateChannelCommandOutput} from "@aws-sdk/client-ivs";
import BroadcastDevice from "./components/BroadcastDevice.vue";

const channelName = ref('')
const channel = ref<CreateChannelCommandOutput|null>(null)

async function handleCreateChannel(){
  channel.value = await createIvsChannel(channelName.value)
}


</script>

<style>
#app {
  text-align: center;
}
</style>