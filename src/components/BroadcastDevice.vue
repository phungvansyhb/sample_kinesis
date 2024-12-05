<template>
  <div>
    <video ref="videoElement" controls autoplay></video>
    <div>
      <select ></select>
      <select></select>
    </div>
    <button @click="startBroadcast">Start Broadcast</button>
    <button @click="stopBroadcast">Stop Broadcast</button>
  </div>
</template>

<script async setup lang="ts" >

import {onMounted, ref} from "vue";
import IVSBroadcastClient, {AmazonIVSBroadcastClient} from 'amazon-ivs-web-broadcast';
import {handlePermissions, listDevice, requestVideoMediaStream , requestAudioMediaStream} from "../helper/MediaHelper";

const videoElement = ref<HTMLVideoElement | null>(null);
const props = defineProps<{ingestEndpoint : string , streamKey : string }>()
const client = ref<AmazonIVSBroadcastClient | null> = null;

const cameraDevices = ref<MediaDeviceInfo[]|[]>([])
const audioDevices = ref<MediaDeviceInfo[]|[]>([])


async function onSelectCamera(selected : MediaDeviceInfo){
   const cameraStream = await  requestVideoMediaStream(selected)
  client.addVideoInputDevice(cameraStream, 'camera1' , { index: 0 });
}

async function onSelectAudio(selected : MediaDeviceInfo){
  const audioStream = await  requestAudioMediaStream(selected)
  client.addAudioInputDevice(audioStream, 'mic1');
}


client.value.attachPreview(videoElement.value)


function startBroadcast(){
  client.value
      .startBroadcast(props.streamKey)
      .then((result) => {
        console.log('I am successfully broadcasting!');
      })
      .catch((error) => {
        console.error('Something drastically failed while broadcasting!', error);
      });
}

function stopBroadcast(){
  client.value.stopBroadcast()
}



onMounted(async () => {
  if (videoElement.value) {
    client.value = IVSBroadcastClient.create({
      streamConfig: IVSBroadcastClient.BASIC_LANDSCAPE,
      ingestEndpoint : props.ingestEndpoint,
    });
  }
  await handlePermissions()
  const devices = await listDevice()
  cameraDevices.value = devices.videoDevices
  audioDevices.value = devices.audioDevices
});


</script>



