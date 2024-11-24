<template>
  <div id="app">
    <h1>Kinesis Video Streams WebRTC Example</h1>
    <button @click="role = 'master'">Start as Master</button>
    <button @click="role = 'viewer'">Start as Viewer</button>
    <Master v-if="role === 'master'" />
    <Viewer v-if="role === 'viewer'" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import Master from './components/MasterChannel.vue';
import Viewer from './components/ViewerChannel.vue';

export default defineComponent({
  components: {
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