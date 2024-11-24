<template>
  <div>
    <h1>Viewer</h1>
    <video ref="remoteVideo" autoplay playsinline controls></video>
    <video ref="localVideo" autoplay playsinline controls></video>
  </div>
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
      peerConnection.value.addIceCandidate(new RTCIceCandidate(candidate));
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

  signalingClientRef.value.on('error', error => {
    console.error('[VIEWER] Signaling error:', error);
  })

  signalingClientRef.value.open();
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