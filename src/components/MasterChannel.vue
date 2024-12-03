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
  getIceSevers, joinStorageSessionManually, kinesisVideoClient,
  kinesisVideoSignalingChannelsClient,
  signalingMaster
} from '../config';
import {Role, SignalingClient} from "amazon-kinesis-video-streams-webrtc";

const localVideo = ref<HTMLVideoElement | null>(null);
const localStream = ref<MediaStream | null>(null);
const signalingMasterRef = ref<any>(null);
const peerConnection = ref<RTCPeerConnection | null >();

const dataChannel = ref<RTCDataChannel | null>(null);
const message = ref('');
const receivedMessages = ref<string[]>([]);

const initSignaling = async () => {
  const channelARN = await getChannelARN(APP_STRUCTURE.CHANNEL_NAME);
  const endpoints = await endpointsByProtocol(Role.MASTER, channelARN);
  const kvsChannelsClient = kinesisVideoSignalingChannelsClient(endpoints.HTTPS);
  const iceServers = await getIceSevers(kvsChannelsClient, endpoints.HTTPS, channelARN);


  signalingMasterRef.value = signalingMaster({ channelARN, channelEndpoint: endpoints.WSS });

  signalingMasterRef.value.on('open', async () => {
    console.log('[MASTER] Signaling master opened');
    localStream.value = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: true
    });
    if (localVideo.value && localStream.value) {
      localVideo.value.srcObject = localStream.value;
    }
    await joinStorageSessionManually(endpoints.WEBRTC);
    console.log('[MASTER] waiting for other viewer ... ');
  });

  signalingMasterRef.value.on('sdpOffer', async (offer , remoteClientId : string) => {
    console.log('[MASTER] received SDP offer from remote');
    try {
      peerConnection.value = new RTCPeerConnection({ iceServers });

      await peerConnection.value.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await peerConnection.value.createAnswer();

      await peerConnection.value.setLocalDescription(answer);

      console.log('sending answer to remote',answer)
      await signalingMasterRef.value.sendSdpAnswer(answer, remoteClientId, '123123123')  ;

      peerConnection.value.addEventListener('icecandidate', ({ candidate }) => {
        if (candidate) {
          console.log('[MASTER] ICE sending to remote');
          signalingMasterRef.value.sendIceCandidate(candidate);
        }
      });

      peerConnection.value.addEventListener('track', (event) => {
        console.log('[MASTER] received remote track', event.streams);
        if (event.streams && event.streams[0]) {
        } else {
          console.error('[MASTER] No streams received in track event');
        }
      });

      peerConnection.value.addEventListener('connectionstatechange', () => {
        console.log('[MASTER] peerConnection state:', peerConnection.value.connectionState);
      });

    } catch (error) {
      console.error('[MASTER] Error setting remote description:', error);
    }

  });

  signalingMasterRef.value.on('iceCandidate', (candidate: RTCIceCandidate , remoteClientId : string) => {
      console.log('[MASTER] receive ice candidate from remote', remoteClientId);
      peerConnection.value.addIceCandidate(candidate);
  });

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

async function getHLSUrl() {
  const hlsUrl =await getHLSSessionURL()
  console.log(hlsUrl)
  return hlsUrl;
}

onMounted(() => {
  initSignaling();
});
</script>


// TODO  : create signal-channel -> create data-channel -> update media storage config cua signal-chanel tro vao data-channel -> connect signaling channel
// -> join sessionStorage -> open peer connection as a viewer -> video playback ready , call getHLSUrl -> share hls url and play in HLS player