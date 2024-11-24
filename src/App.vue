<template>
  <div id="app">
    <h1>Kinesis Video Streams WebRTC Example</h1>
    <button @click="role = 'master'">Start as Master</button>
    <button @click="role = 'viewer'">Start as Viewer</button>
    <button @click="role = 'local-asset'">Stream local video as Viewer</button>
    <Master v-if="role === 'master'" />
    <Viewer v-if="role === 'viewer'" />
    <MasterStreamAssetChannel v-if="role === 'local-asset'" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import Master from './components/MasterChannel.vue';
import Viewer from './components/ViewerChannel.vue';
import MasterStreamAssetChannel from "./components/MasterStreamAssetChannel.vue";

export default defineComponent({
  components: {
    MasterStreamAssetChannel,
    Master,
    Viewer,
  },
  setup() {
    const role = ref<string | null>(null);
    return {
      role,
    };
  },
});
</script>

<style>
#app {
  text-align: center;
}
</style>