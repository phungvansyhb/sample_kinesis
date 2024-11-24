<template>
  <div>
    <h1>Master</h1>
    <video ref="localVideo" autoplay playsinline controls></video>
    <video ref="remoteVideo" autoplay playsinline controls></video>
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

const localVideo = ref<HTMLVideoElement | null>(null);
const remoteVideo = ref<HTMLVideoElement | null>(null);
const localStream = ref<MediaStream | null>(null);
const remoteStream = ref<MediaStream | null>(null);
const signalingMasterRef = ref<any>(null);
const peerConnection = ref<RTCPeerConnection | null>(null);

const initSignaling = async () => {
  const channelARN = await getChannelARN(APP_STRUCTURE.CHANNEL_NAME);
  const endpoints = await endpointsByProtocol(Role.MASTER, channelARN);
  const kvsChannelsClient = kinesisVideoSignalingChannelsClient(endpoints.HTTPS);
  const iceServers = await getIceSevers(kvsChannelsClient, endpoints.HTTPS, channelARN);


  peerConnection.value = new RTCPeerConnection({ iceServers });


  signalingMasterRef.value = signalingMaster({ channelARN, channelEndpoint: endpoints.WSS });

  signalingMasterRef.value.on('open', async () => {
    console.log('[MASTER] Signaling master opened');
    localStream.value = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: true
    });
    if (localVideo.value && localStream.value) {
      localVideo.value.srcObject = localStream.value;
      localStream.value.getTracks().forEach(track => peerConnection.value.addTrack(track, localStream.value));
    }
    console.log('[MASTER] waiting for other viewer ... ');
  });

  signalingMasterRef.value.on('sdpOffer', async (offer, remoteClientId) => {
    console.log('[MASTER] received SDP offer from', remoteClientId);
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
      // console.log('[MASTER] Sending ICE candidate:', candidate);
      signalingMasterRef.value.sendIceCandidate(candidate);
    } else {
      console.log('[MASTER] All ICE candidates have been sent');
    }
  });

  signalingMasterRef.value.on('error', (error) => {
    console.error('[MASTER] Signaling error:', error);
  })
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


  signalingMasterRef.value.open();
}

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