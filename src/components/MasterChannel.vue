<template>
    <section class="flex gap-2 ">

      <div class="flex-grow">
        <video ref="localVideo" class="w-full h-auto" autoplay playsinline controls></video>
        <button @click="getHLSUrl">Get Link HLS</button>
      </div>

      <div class="w-[300px]">
        <div class="flex gap-2 ">
          <input v-model="message" placeholder="Type your message " class="w-full h-10 p-1 border rounded-lg" />
          <button @click="sendMessage" :disabled="dataChannel?.readyState !== 'open'">Send</button>
        </div>

        <div class="border bg-white min-h-[200px] w-full rounded-lg">
          <ul>
            <li v-for="msg in receivedMessages" :key="msg" class="text-black">{{ msg }}</li>
          </ul>
        </div>
      </div>

    </section>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import {
  APP_STRUCTURE,
  endpointsByProtocol,
  getChannelARN, getHLSSessionURL,
  getIceSevers, kinesisVideoClient,
  kinesisVideoSignalingChannelsClient,
  signalingMaster
} from '../config';
import {Role, SignalingClient} from "amazon-kinesis-video-streams-webrtc";

const localVideo = ref<HTMLVideoElement | null>(null);
const localStream = ref<MediaStream | null>(null);
const signalingMasterRef = ref<any>(null);
const peerConnection = ref<{ [key:string] : RTCPeerConnection } >({});

const dataChannel = ref<RTCDataChannel | null>(null);
const message = ref('');
const receivedMessages = ref<string[]>([]);

const initSignaling = async () => {
  const channelARN = await getChannelARN(APP_STRUCTURE.CHANNEL_NAME);
  const endpoints = await endpointsByProtocol(Role.MASTER, channelARN);
  const kvsChannelsClient = kinesisVideoSignalingChannelsClient(endpoints.HTTPS);
  const iceServers = await getIceSevers(kvsChannelsClient, endpoints.HTTPS, channelARN);

  signalingMasterRef.value = signalingMaster({ channelARN, channelEndpoint: endpoints.WSS });
  // await kinesisVideoClient.createStream({StreamName : APP_STRUCTURE.STREAM_NAME , DataRetentionInHours : 1}).promise()
  signalingMasterRef.value.on('open', async () => {
    console.log('[MASTER] Signaling master opened');
    localStream.value = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: true
    });
    if (localVideo.value && localStream.value) {
      localVideo.value.srcObject = localStream.value;
      // localStream.value.getTracks().forEach(track => peerConnection.value.addTrack(track, localStream.value));
    }
    console.log('[MASTER] waiting for other viewer ... ');
  });

  signalingMasterRef.value.on('sdpOffer', async (offer, remoteClientId) => {
    console.log('[MASTER] received SDP offer from', remoteClientId)
    createPeer(remoteClientId , iceServers)
    try {
      await peerConnection.value[remoteClientId].setRemoteDescription(new RTCSessionDescription(offer));
    } catch (error) {
      console.error('[MASTER] Error setting remote description:', error);
    }
    const answer = await peerConnection.value[remoteClientId].createAnswer();
    await peerConnection.value[remoteClientId].setLocalDescription(answer);
    console.log('[MASTER] sending SDP answer:', answer);
    await signalingMasterRef.value.sendSdpAnswer(answer,remoteClientId);
  });

  signalingMasterRef.value.on('iceCandidate', (candidate: RTCIceCandidate , remoteClientId:string) => {
    console.log('iceCandidate received from ',remoteClientId)
    if (candidate) {
      peerConnection.value[remoteClientId].addIceCandidate(candidate);
    } else {
      console.log('[MASTER] All ICE candidates have been sent');
    }
  });

  // dataChannel.value = peerConnection.value.createDataChannel(APP_STRUCTURE.DATA_CHANNEL,{ negotiated: true, id: 0 });
  //
  // dataChannel.value.onopen = () => {
  //   console.log('[MASTER] Data channel is open');
  //   dataChannel.value.send('Hello from Master!');
  // };
  //
  // dataChannel.value.onmessage = (event) => {
  //   console.log('[MASTER] Message received:', event.data);
  //   receivedMessages.value.push(event.data); // Store the received message
  // };

  signalingMasterRef.value.on('error', (error) => {
    console.error('[MASTER] Signaling error:', error);
  })

  signalingMasterRef.value.open();
}

function createPeer(clientId , iceServers : any){
  peerConnection.value[clientId] = new RTCPeerConnection({ iceServers });

  localStream.value.getTracks().forEach(track => peerConnection.value[clientId].addTrack(track, localStream.value));

  peerConnection.value[clientId].addEventListener('icecandidate', ({ candidate }) => {
    if (candidate) {
      signalingMasterRef.value.sendIceCandidate(candidate);
    }
  });

  peerConnection.value[clientId].addEventListener('track', event => {
    console.log('[MASTER] received remote track', event.streams);
    if (event.streams && event.streams[0]) {
    } else {
      console.error('[MASTER] No streams received in track event');
    }
  });

  peerConnection.value[clientId].addEventListener('connectionstatechange', () => {
    console.log('[MASTER] peerConnection state:', peerConnection.value.connectionState);
  });
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

async function getHLSUrl() {
  const hlsUrl =await getHLSSessionURL()
  console.log(hlsUrl)
  return hlsUrl;
}

onMounted(() => {
  initSignaling();
});
</script>
