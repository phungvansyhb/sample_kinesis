<template>
  <div>
    <h1>You are master</h1>
    <section class="grid grid-cols-4 gap-2">
      <div class="col-span-3">
        <input type="file" @change="onFileChange" name="video" accept="application/mp4">
        <video ref="localVideo" controls @loadedmetadata="startStreaming" crossorigin="anonymous">
          <source :src="mediaPath" type="video/mp4">
          Your browser does not support the video tag.
        </video>
      </div>
      <div>
        <section>
          <video ref="remoteVideo" autoplay playsinline controls></video>
          <h2>{{remoteVideo?.id}}</h2>
        </section>
      </div>
    </section>

    <div class="text-left">
      <input v-model="message" placeholder="Type your message " class="w-2/3 h-10 p-1 border rounded-lg" />
      <button @click="sendMessage" :disabled="dataChannel?.readyState !== 'open'">Send</button>
    </div>

    <div class="border bg-white min-h-[200px] w-2/3 rounded-lg">
      <ul>
        <li v-for="msg in receivedMessages" :key="msg" class="text-black">{{ msg }}</li>
      </ul>
    </div>

  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import {
  APP_STRUCTURE,
  endpointsByProtocol,
  getChannelARN,
  getIceSevers,
  kinesisVideoSignalingChannelsClient,
  signalingMaster
} from '../config';
import { Role } from "amazon-kinesis-video-streams-webrtc";

const localVideo = ref(null);
const remoteVideo = ref<HTMLVideoElement | null>(null);
const localStream = ref<MediaStream | null>(null);
const remoteStream = ref<MediaStream | null>(null);
const signalingMasterRef = ref<any>(null);
const peerConnection = ref<RTCPeerConnection | null>(null);
const mediaPath = ref(null)

const dataChannel = ref<RTCDataChannel | null>(null);
const message = ref('');
const receivedMessages = ref<string[]>([]);

const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    const file = target.files[0];
    const videoURL = URL.createObjectURL(file);
    if (localVideo.value) {
      localVideo.value.src = videoURL; // Set the video source to the selected file
    }
  }
};

const initSignaling = async () => {
  const channelARN = await getChannelARN(APP_STRUCTURE.CHANNEL_NAME);
  const endpoints = await endpointsByProtocol(Role.MASTER, channelARN);
  const kvsChannelsClient = kinesisVideoSignalingChannelsClient(endpoints.HTTPS);
  const iceServers = await getIceSevers(kvsChannelsClient, endpoints.HTTPS, channelARN);

  peerConnection.value = new RTCPeerConnection({ iceServers });

  signalingMasterRef.value = signalingMaster({ channelARN, channelEndpoint: endpoints.WSS });

  signalingMasterRef.value.on('open', async () => {
    console.log('[MASTER] Signaling master opened');
    console.log('[MASTER] waiting for other viewer ... ');
  });

  signalingMasterRef.value.on('sdpOffer', async (offer, remoteClientId) => {
    console.log('[MASTER] received SDP offer from', remoteClientId);
    remoteVideo.value.id = remoteClientId;
    try {
      await peerConnection.value.setRemoteDescription(new RTCSessionDescription(offer));
    } catch (error) {
      console.error('[MASTER] Error setting remote description:', error);
    }
    const answer = await peerConnection.value.createAnswer();
    await peerConnection.value.setLocalDescription(answer);
    console.log('[MASTER] sending SDP answer:', answer);
    await signalingMasterRef.value.sendSdpAnswer(answer,remoteClientId);
  });

  signalingMasterRef.value.on('iceCandidate', (candidate: RTCIceCandidate) => {
    if (candidate) {
      peerConnection.value.addIceCandidate(candidate);
    } else {
      console.log('[MASTER] All ICE candidates have been sent');
    }
  });

  peerConnection.value.addEventListener('icecandidate', ({ candidate }) => {
    if (candidate) {
      signalingMasterRef.value.sendIceCandidate(candidate);
    }
  });


  peerConnection.value.addEventListener('track', event => {
    console.log('[MASTER] received remote track', event.streams);
    if (event.streams && event.streams[0]) {
      remoteStream.value = event.streams[0];
      remoteVideo.value.srcObject = remoteStream.value;
    } else {
      console.error('[MASTER] No streams received in track event');
    }
  });

  peerConnection.value.addEventListener('connectionstatechange', () => {
    console.log('[MASTER] peerConnection state:', peerConnection.value.connectionState);
  });

  dataChannel.value = peerConnection.value.createDataChannel(APP_STRUCTURE.DATA_CHANNEL,{ negotiated: true, id: 0 });

  // Set up event listeners for the DataChannel
  dataChannel.value.onopen = () => {
    console.log('[MASTER] Data channel is open');
    dataChannel.value.send('Hello from Master!');
  };

  dataChannel.value.onmessage = (event) => {
    console.log('[MASTER] Message received:', event.data);
    receivedMessages.value.push(event.data); // Store the received message
  };

  signalingMasterRef.value.on('error', (error) => {
    console.error('[MASTER] Signaling error:', error);
  })

  signalingMasterRef.value.open();
}

const sendMessage = () => {
  if (dataChannel.value && dataChannel.value.readyState === 'open') {
    dataChannel.value.send(message.value);
    console.log('[MASTER] Sent message:', message.value);
    message.value = ''; // Clear the input after sending
  } else {
    console.error('[MASTER] Data channel is not open');
  }
};

const startStreaming = () => {
  if (localVideo.value) {
    localStream.value = localVideo.value.captureStream();
    if (localVideo.value && localStream.value) {
      // localVideo.value.srcObject = localStream.value;
      localStream.value.getTracks().forEach(track => peerConnection.value.addTrack(track, localStream.value));
    }

    console.log('[MASTER] Video streaming started');
  }
};

onMounted(() => {
  initSignaling();
});
</script>

<style scoped>
video {
  width: 100%;
  height: auto;
}
</style>