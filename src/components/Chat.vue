// Chat.vue
<template>
  <section class="min-w-[300px] bg-white border rounded">
    <div class="w-full h-full flex flex-col justify-end">
      <ul class="h-full text-black">
        <li v-for="message in messages" :key="message.id" class="text-left flex justify-between px-2">
          <div>
            <b>{{message.sender.attributes.username}}</b> : {{ message.attributes.text }}
          </div>
          <div>
            {{new Date(message.sendTime).toDateString()}}
          </div>
        </li>
      </ul>
      <div class="flex gap-2 justify-between">
        <input v-model="message" type="text" placeholder="Type a message" class="p-3 h-11 rounded-lg " />
        <button @click="sendMessage">Send</button>
      </div>

    </div>
  </section>
</template>

<script setup lang="ts">
import {ref, onMounted, computed} from 'vue';
import {createConnectionToRoom, createRoomToken} from "../helper/ChatRoomHelper";
import {ChatMessage, ChatRoom} from "amazon-ivs-chat-messaging";
import {useRoute} from "vue-router";

const route = useRoute()
const props = defineProps<{ isHost : boolean , chatARN? : string }>()
const chatARN = props.chatARN || route.params.roomArn as string
const chatRoom = ref<ChatRoom | null>(null);
const messages = ref<ChatMessage[]|[]>([]);
const message = ref('');

const chatRoomReady = computed(()=>chatRoom.value?.state === 'connected')

onMounted(async () => {
  try {

    const fakeUser = {
      id : Math.round(Math.random()*10).toString(),
      name : 'John Doe',
      avatar : 'https://via.placeholder.com/150'
    }

    chatRoom.value = await createConnectionToRoom({roomArn : chatARN , user :fakeUser , role : props.isHost ? 'host' : 'viewer'})
    chatRoom.value.connect();
    if(chatRoom.value){
      chatRoom.value.addListener('message', (message) => {
        messages.value.push(message)
      })
    }

  } catch (error) {
    console.error(error);
  }
});


async function sendMessage() {
  try {
    await chatRoom.value.sendMessage({
      action : 'SEND_MESSAGE',
      content : 'text/plain',
      requestId : Math.round(Math.random()*100000).toString(),
      attributes : {
        text : message.value
      }
    });
    message.value = '';
  } catch (error) {
    console.error(error);
  }
}
</script>