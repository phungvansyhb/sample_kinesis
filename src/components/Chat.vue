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
import {createConnectionToRoom, createRoomChat} from "../helper/ChatRoomHelper";
import {ChatRoom} from "amazon-ivs-chat-messaging";

const props = defineProps<{ channelArn : string , isHost : boolean }>()
const chatConnection = ref<ChatRoom | null>(null);

const messages = ref([]);
const message = ref('');

onMounted(async () => {
  try {
    const room = await createRoomChat(props.channelArn);

    const fakeUser = {
      id : Math.round(Math.random()*10).toString(),
      name : 'John Doe',
      avatar : 'https://via.placeholder.com/150'
    }

    chatConnection.value = await createConnectionToRoom({roomArn : room.arn , user :fakeUser , role : props.isHost ? 'host' : 'viewer'})

  } catch (error) {
    console.error(error);
  }
});

async function sendMessage() {
  try {
    await chatConnection.value.sendMessage({

    });
    message.value = '';
  } catch (error) {
    console.error(error);
  }
}
</script>