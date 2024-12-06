// Chat.vue
<template>
  <section class="min-w-[200px] bg-white border rounded">
    <div v-if="chatConnection">
      <input v-model="message" type="text" placeholder="Type a message" />
      <button @click="sendMessage">Send</button>
      <ul>
        <li v-for="message in messages" :key="message.id">{{ message.text }}</li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {chatClient} from "../helper/ChatRoomHelper";


const chatConnection = ref(null);
const messages = ref([]);
const message = ref('');

onMounted(async () => {
  try {
    const connection = await chatClient({
      channelArn: 'your-channel-arn',
    });
    chatConnection.value = connection;
    connection.on('message', (message) => {
      messages.value.push(message);
    });
  } catch (error) {
    console.error(error);
  }
});

async function sendMessage() {
  try {
    await chatClient.send({
      message : message.value
    });
    message.value = '';
  } catch (error) {
    console.error(error);
  }
}
</script>