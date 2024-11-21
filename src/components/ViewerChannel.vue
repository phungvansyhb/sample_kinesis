<template>
	<div class="flex flex-col">
		<div class="flex gap-2 my-2">
			<input
				v-model="channelId"
				placeholder="Enter channel ID" />
			<input
				v-model="channelName"
				placeholder="Enter channel Name" />
			<button @click="joinChannel">Join Channel</button>
			<button @click="quit">Quit Channel</button>
		</div>
		<div class="">
			<video
				class="relative top-0 right-0"
				ref="localVideo"
				width="240"
				height="240"
				autoplay
				controls
				playsinline></video>
			<video
				ref="remoteVideo"
				width="full"
				height="500"
				autoplay
				controls
				playsinline></video>
		</div>
	</div>
</template>

<script setup lang="ts">
import { Role, SignalingClient } from 'amazon-kinesis-video-streams-webrtc';
import { ref } from 'vue';

const channelName = ref();
const channelId = ref();
const remoteVideo = ref();
const localVideo = ref();
let signalClient = ref<SignalingClient | null>(null);
let peerConnection = ref<RTCPeerConnection | null>(null);

async function getSignalingChannelEndpointResponse(channelARN: string) {
	const endpoint = await kinesisVideo
		.getSignalingChannelEndpoint({
			ChannelARN: channelARN,
			SingleMasterChannelEndpointConfiguration: {
				Protocols: ['WSS', 'HTTPS'],
				Role: Role.VIEWER,
			},
		})
		.promise();
	return endpoint.ResourceEndpointList?.reduce((endpoints, endpoint) => {
		//@ts-ignore
		endpoints[endpoint.Protocol] = endpoint.ResourceEndpoint;
		return endpoints;
	}, {});
}

const getChannelARN = async () => {
	const channel = await kinesisVideo
		.describeSignalingChannel({ ChannelName: channelName.value })
		.promise();
	return channel.ChannelInfo?.ChannelARN || '';
};

async function joinChannel() {
	const channelARN = await getChannelARN();
	const endpoint = await getSignalingChannelEndpointResponse(channelARN);
	signalClient.value = new SignalingClient({
		channelARN: channelARN,
		clientId: channelId.value,
		role: Role.VIEWER,
		region: 'us-west-2',
		//@ts-ignore
		channelEndpoint: endpoint.HTTPS,
		credentials: {
			accessKeyId: 'AKIATDLD55P2443PFW6H',
			secretAccessKey: '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',
		},
	});
	peerConnection.value = new RTCPeerConnection({
		iceServers: [
			{
				urls: 'stun:stun.kinesisvideo.us-west-2.amazonaws.com:443',
			},
		],
		iceTransportPolicy: 'all',
	});

	signalClient.value.on('open', async () => {
		console.log('hello open webRTC');
		const localStream = await navigator.mediaDevices.getUserMedia({
			video: true,
			audio: false,
		});
		localStream
			.getTracks()
			.forEach((track) => peerConnection.value?.addTrack(track, localStream));
		localVideo.value.srcObject = localStream;

		const offer = await peerConnection.value?.createOffer({
			offerToReceiveAudio: true,
			offerToReceiveVideo: true,
		});
		await peerConnection.value?.setLocalDescription(offer);

		signalClient.value?.sendSdpOffer(peerConnection.value?.localDescription!);
	});

	signalClient.value.on('sdpAnswer', async (answer) => {
		await peerConnection.value?.setRemoteDescription(answer);
	});

	signalClient.value.on('iceCandidate', (candidate) => {
		peerConnection.value?.addIceCandidate(candidate);
	});

	peerConnection.value?.addEventListener('icecandidate', ({ candidate }) => {
		if (candidate) {
			console.log('[VIEWER] Generated ICE candidate', 'ICE candidate:', candidate);
			signalClient.value?.sendIceCandidate(candidate);
		} else {
			console.log('[VIEWER] All ICE candidates have been generated');
		}
	});

	signalClient.value.on('close', () => {
		console.log('[VIEWER] Disconnected from signaling channel');
	});

	signalClient.value.on('error', (error) => {
		console.error('[VIEWER] Signaling client error:', error);
	});

	peerConnection.value?.addEventListener('connectionstatechange', async (event) => {
		console.log('status change', event);
	});

	peerConnection.value?.addEventListener('track', (event) => {
		console.log(
			'[VIEWER] Received remote track with id:',
			event?.streams[0]?.id ?? '[Error retrieving track ID]'
		);
		if (remoteVideo.value.srcObject) {
			return;
		}
		remoteVideo.value.srcObject = event.streams[0];
	});

	signalClient.value.open();
}

function quit() {
	if (signalClient.value) {
		signalClient.value.close();
	}
	if (peerConnection.value) {
		peerConnection.value.close();
	}

	remoteVideo.value.getTracks().forEach((track) => track.stop());
	remoteVideo.value.srcObject = null;
}
</script>
