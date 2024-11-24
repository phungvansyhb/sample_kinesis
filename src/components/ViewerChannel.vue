<template>
  <h1>You are viewer</h1>

  <section class="grid grid-cols-2 gap-2 w-full">
    <div>
      <h2>Viewer cam:</h2>
      <video ref="localVideo" autoplay playsinline controls></video>
      <h2>Master cam:</h2>
      <video ref="remoteVideo" autoplay playsinline controls></video>
    </div>
    <section class="py-4">
      <div class="text-left">
        <input v-model="message" placeholder="Type your message " class="w-full h-10 p-1 border rounded-lg" />
        <button @click="sendMessage" >Send</button>
      </div>

      <div class="border bg-white min-h-[200px] w-full rounded-lg ">
        <ul>
          <li v-for="msg in receivedMessages" :key="msg" class="text-black">{{ msg }}</li>
        </ul>
      </div>
    </section>
  </section>



</template>

<script lang="ts" setup>
import {ref, onMounted, watch} from 'vue';
import {
  APP_STRUCTURE,
  signalingClient,
  endpointsByProtocol,
  getIceSevers,
  getChannelARN,
  kinesisVideoSignalingChannelsClient} from '../config';
import { Role } from "amazon-kinesis-video-streams-webrtc";

const remoteVideo = ref<HTMLVideoElement | null>(null);
const localVideo = ref<HTMLVideoElement | null>(null);
const localStream = ref<MediaStream | null>(null);
const remoteStream = ref<MediaStream | null>(null);
const signalingClientRef = ref<any>(null);
const peerConnection = ref<RTCPeerConnection | null>(null);

const dataChannel = ref<RTCDataChannel | null>(null);
const message = ref('');
const receivedMessages = ref<string[]>([]);

const initSignaling = async () => {
  const channelARN = await getChannelARN(APP_STRUCTURE.CHANNEL_NAME);
  const endpoints = await endpointsByProtocol(Role.VIEWER, channelARN);
  const kvsChannelsClient = kinesisVideoSignalingChannelsClient(endpoints.HTTPS);
  const iceServers = await getIceSevers(kvsChannelsClient, endpoints.HTTPS, channelARN);

  peerConnection.value = new RTCPeerConnection({ iceServers });


  signalingClientRef.value = signalingClient({ channelARN, channelEndpoint: endpoints.WSS, clientId: 'viewer' });

  signalingClientRef.value.on('open', async () => {
    console.log('[VIEWER] Signaling viewer opened');
    localStream.value = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: true
    });

    if(localVideo.value && localStream.value) {
      localVideo.value.srcObject = localStream.value;
      localStream.value.getTracks().forEach(track => peerConnection.value.addTrack(track, localStream.value));
    }

    // Create and send SDP offer
    const offer = await peerConnection.value.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    await peerConnection.value.setLocalDescription(offer);
    console.log('[VIEWER] Sending SDP offer:', offer);
    await signalingClientRef.value.sendSdpOffer(offer);
  });

  signalingClientRef.value.on('sdpAnswer', async (answer: RTCSessionDescriptionInit) => {
    console.log('[VIEWER] Received SDP answer:', answer);
    try {
      await peerConnection.value.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('[VIEWER] Error setting remote description:', error);
    }
  });

  signalingClientRef.value.on('iceCandidate', (candidate: RTCIceCandidate) => {
    console.log('[VIEWER] Received ICE candidate:', candidate);
    if (peerConnection.value) {
      peerConnection.value.addIceCandidate(candidate);
    }
  });

  peerConnection.value.addEventListener('icecandidate', ({ candidate }) => {
    if (candidate) {
      // console.log('[VIEWER] Sending ICE candidate:', candidate);
      signalingClientRef.value.sendIceCandidate(candidate);
    }else{
      console.log('[VIEWER] all candidate is sended');
    }
  });

  peerConnection.value.addEventListener('track', event => {
    console.log('[VIEWER] Received remote track with id:', event?.streams[0]?.id ?? '[Error retrieving track ID]');
    console.log('[VIEWER] received remote track', event.streams);
    if (event.streams && event.streams[0]) {
      remoteStream.value = event.streams[0];
      remoteVideo.value.srcObject = remoteStream.value;
    } else {
      console.error('[VIEWER] No streams received in track event');
    }
  });

  peerConnection.value.addEventListener('signalingstatechange', () => {
    console.log('[VIEWER] peerConnection state:', peerConnection.value.connectionState);
    console.log(peerConnection.value)
  });

  dataChannel.value = peerConnection.value.createDataChannel(APP_STRUCTURE.DATA_CHANNEL,{ negotiated: true, id: 0 });

  // Set up event listeners for the DataChannel
  dataChannel.value.onopen = () => {
    console.log('[VIEWER] Data channel is open');
    dataChannel.value.send('Hello from Viewer!');
  };

  dataChannel.value.onmessage = (event) => {
    console.log('[VIEWER] Message received:', event.data);
    receivedMessages.value.push(event.data); // Store the received message
  };

  signalingClientRef.value.on('error', error => {
    console.error('[VIEWER] Signaling error:', error);
  })

  signalingClientRef.value.open();
};

const sendMessage = () => {
  if (dataChannel.value && dataChannel.value.readyState === 'open') {
    dataChannel.value.send(message.value);
    console.log('[VIEWER] Sent message:', message.value);
    message.value = ''; // Clear the input after sending
  } else {
    console.error('[VIEWER] Data channel is not open');
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