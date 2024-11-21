<template>
	<div class="flex flex-col">
		<div class="flex gap-2 mb-2">
			<input
				v-model="channelName"
				placeholder="Enter channel name" />
			<button @click="createChannel">Create Channel</button>
			<button @click="stopChannel">Stop Channel</button>
		</div>

		<video
			ref="localVideo"
			width="800"
			height="500"
			autoplay
			controls
			playsinline></video>
    <video
        ref="remoteVideo"
        width="800"
        height="500"
        autoplay
        controls
        playsinline></video>
	</div>
</template>

<script lang="ts" setup>
import {kinesisVideoClient , kinesisVideoSignalingChannelsClient} from '../config';
import { ref } from 'vue';

const channelName = ref('');
const localVideo = ref();
const remoteVideo = ref();
let mediaRecorder: any;

const createChannel = async () => {
	if (channelName.value) {
		const params = {
			StreamName: channelName.value,
			DataRetentionInHours: 24,
		};

		try {
			await kinesisVideoClient.createStream(params).promise();
			startVideoStream();
		} catch (e) {
			console.log('create stream error', e);
		}

		try {
			const signaling = await kinesisVideoClient
				.createSignalingChannel({
					ChannelName: channelName.value,
				})
				.promise();
			console.log('create signaling success', signaling);
		} catch (e) {
			console.log('create signaling error', e);
		}

	} else {
		alert('Please enter a channel name.');
	}
};

const startVideoStream = () => {
	navigator.mediaDevices
		.getUserMedia({ video: true })
		.then((stream) => {
			console.log('Stream obtained:', stream);
			videoRef.value.srcObject = stream;
			mediaRecorder = new MediaRecorder(stream);
			mediaRecorder.ondataavailable = (event) => {
					const data = event.data;
					const params = {
						StreamName: channelName.value,
						Data: data,
						PartitionKey: 'partition-key',
					};
					kinesisVideo.putRecord(params, (err, data) => {
						if (err) console.error(err);
						else console.log('Successfully sent data to Kinesis Video Stream', data);
					});
			};
			mediaRecorder.start();
		})
		.catch((error) => console.error('Error accessing media devices.', error));
};

const stopChannel = () => {
	if (mediaRecorder) {
		mediaRecorder.stop();
		console.log('MediaRecorder stopped.');
	}
	if (videoRef.value && videoRef.value.srcObject) {
		const tracks = videoRef.value.srcObject.getTracks();
		tracks.forEach((track) => track.stop());
		videoRef.value.srcObject = null;
		console.log('Video stream stopped.');
	}
};
</script>
