<template>
  <div v-if="!channel">
    <input class="w-[200px] h-10 border rounded" v-model="channelName"></input>
    <button @click="handleCreateChannel">Create channel</button>
  </div>
  <div v-else class="flex gap-4">
    <BroadcastDevice :ingest-endpoint="channel.channel.ingestEndpoint"
                     :streamKey="channel.streamKey.value"
                     :channelARN="channel.channel.arn"
                     :chatARN="chatRoom.arn"
    />
    <Chat :chatARN="chatRoom.arn" :is-host="true"/>
  </div>

</template>

<script lang="ts" setup>
import {onMounted, ref} from "vue";
import {createIvsChannel} from "./helper/IVSHelper";
import {CreateChannelCommandOutput} from "@aws-sdk/client-ivs";
import BroadcastDevice from "./components/BroadcastDevice.vue";
import Chat from "./components/Chat.vue";
import {createRoomChat} from "./helper/ChatRoomHelper";
import {CreateRoomCommandOutput} from "@aws-sdk/client-ivschat";

const demoChannel: any = {
  "channel": {
    "arn": "arn:aws:ivs:us-west-2:628856589662:channel/bKgfhWMG8tpi",
    "authorized": false,
    "containerFormat": "TS",
    "ingestEndpoint": "71f7fb9559d6.global-contribute.live-video.net",
    "insecureIngest": false,
    "latencyMode": "LOW",
    "multitrackInputConfiguration": {
      "enabled": false,
      "maximumResolution": "FULL_HD",
      "policy": "ALLOW"
    },
    "name": "demo",
    "playbackRestrictionPolicyArn": "",
    "playbackUrl": "https://71f7fb9559d6.us-west-2.playback.live-video.net/api/video/v1/us-west-2.628856589662.channel.bKgfhWMG8tpi.m3u8",
    "preset": "",
    "recordingConfigurationArn": "",
    "srt": {
      "endpoint": "71f7fb9559d6.srt.live-video.net",
      "passphrase": "Ql2nRziUsT7QAYmcJIw9TwG1L0b6S7wxTLxOPQV9dVK9oEGLGXGRuvkFoVQXrvpA0BH9Lo8WnZTYVuu"
    },
    "tags": {},
    "type": "BASIC"
  },
  "streamKey": {
    "arn": "arn:aws:ivs:us-west-2:628856589662:stream-key/9iKIdR9k01kK",
    "channelArn": "arn:aws:ivs:us-west-2:628856589662:channel/bKgfhWMG8tpi",
    "tags": {},
    "value": "sk_us-west-2_9iKIdR9k01kK_WVUJrovqZaiLOafeVsf3dZfYhe5Mma"
  }
}

const demoChat:any = {
  "arn": "arn:aws:ivschat:us-west-2:628856589662:room/TC6fLHr7ycLt",
  "createTime": "2024-12-07T16:33:47.826Z",
  "id": "TC6fLHr7ycLt",
  "maximumMessageLength": 256,
  "maximumMessageRatePerSecond": 10,
  "name": "demo",
  "tags": {},
  "updateTime": "2024-12-07T16:33:47.826Z"
}

const channelName = ref('')
const channel = ref<CreateChannelCommandOutput|null>(demoChannel)
const chatRoom = ref<CreateRoomCommandOutput|null>(demoChat)

function handleCreateChannel(){
  createIvsChannel(channelName.value).then(data=> {
    window.alert("create channel success")
    channel.value = data
  })
  createChatRoom().then((data)=> {
    window.alert("create chat room success")
    chatRoom.value = data
  })
}

async function createChatRoom(){
  return await createRoomChat(channelName.value);
}


</script>
