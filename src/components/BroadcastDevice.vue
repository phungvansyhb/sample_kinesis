<template>
  <div class="w-full">
    <canvas id="videoElement" class="aspect-video w-auto border rounded-lg"></canvas>
    <div class="flex justify-center gap-2 p-4">
      <select>
        <option v-for="camera in cameraDevices" :key="camera.deviceId" @click="onSelectCamera(camera)">{{camera.label}}</option>
      </select>
      <select>
        <option v-for="audio in audioDevices" :key="audio.deviceId" @click="onSelectAudio(audio)">{{audio.label}}</option>
      </select>
    </div>
    <div class="font-bold p-2">{{live ? 'LIVE' : 'OFFLINE'}}</div>
    <div class="flex gap-2 justify-center">
      <button @click="mute" >Mute </button>
      <button @click="hideVideo" >Hide/unhide video </button>
      <button @click="startBroadcast">Start stream</button>
      <button @click="stopBroadcast" disabled>Stop stream</button>
      <button @click="shareStream">Share stream</button>
    </div>

  </div>
</template>

<script setup lang="ts" >

import {onMounted, reactive, ref} from "vue";
import IVSBroadcastClient, {AmazonIVSBroadcastClient} from 'amazon-ivs-web-broadcast';
import {handlePermissions, listDevice, requestVideoMediaStream , requestAudioMediaStream} from "../helper/MediaHelper";

const props = defineProps<{ingestEndpoint : string , streamKey : string , channelARN : string, chatARN : string}>()
let client = reactive<AmazonIVSBroadcastClient>(IVSBroadcastClient.create({
  streamConfig: IVSBroadcastClient.BASIC_LANDSCAPE,
  ingestEndpoint : props.ingestEndpoint,
}));
const live = ref(false)
const cameraDevices = ref<MediaDeviceInfo[]|[]>([])
const audioDevices = ref<MediaDeviceInfo[]|[]>([])

async function addCameraToStream(selected : MediaDeviceInfo){
  const cameraStream = await requestVideoMediaStream(selected)
  client.addVideoInputDevice(cameraStream, 'camera1' , { index: 0 });
}

async function addAudioToStream(selected : MediaDeviceInfo){
  const audioStream = await  requestAudioMediaStream(selected)
  client.addAudioInputDevice(audioStream, 'mic1');
}

function shareStream(){
  navigator.clipboard.writeText(`http://localhost:5173/channel?channelArn=${encodeURIComponent(props.channelARN)}&chatArn=${encodeURIComponent(props.chatARN)}`)
}

async function onSelectCamera(selected : MediaDeviceInfo){
   await addCameraToStream(selected)
}

async function onSelectAudio(selected : MediaDeviceInfo){
  await addAudioToStream(selected)
}


function startBroadcast(){
  client
      .startBroadcast(props.streamKey)
      .then((result) => {
        live.value = true
        console.log('I am successfully broadcasting!');
      })
      .catch((error) => {
        console.error('Something drastically failed while broadcasting!', error);
      });
}

function stopBroadcast(){
  live.value = false
  client.stopBroadcast()
}

function hideVideo(){
  client.disableVideo()
}

function mute(){
  client.disableAudio()
}


onMounted(async () => {
  if(!IVSBroadcastClient.isSupported()){
    window.alert("Your browser is not supported")
  }
  await handlePermissions()
  const devices = await listDevice()
  cameraDevices.value = devices.videoDevices
  audioDevices.value = devices.audioDevices
  client = IVSBroadcastClient.create({
    streamConfig: IVSBroadcastClient.BASIC_LANDSCAPE,
    ingestEndpoint : props.ingestEndpoint,
  });
  client.attachPreview(document.getElementById("videoElement") as HTMLCanvasElement);
  await addCameraToStream(devices.videoDevices[0])
  await addAudioToStream(devices.audioDevices[0])
});



</script>



