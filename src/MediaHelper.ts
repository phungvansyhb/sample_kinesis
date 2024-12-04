async function handlePermissions() {
    let permissions = {
        audio: false,
        video: false,
    };
    try {
        const stream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
        for (const track of stream.getTracks()) {
            track.stop();
        }
        permissions = {video: true, audio: true};
    } catch (err) {
        permissions = {video: false, audio: false};
        console.error(err.message);
    }
    // If we still don't have permissions after requesting them display the error message
    if (!permissions.video) {
        console.error('Failed to get video permissions.');
    } else if (!permissions.audio) {
        console.error('Failed to get audio permissions.');
    }
}

async function listDevice() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    window.videoDevices = devices.filter((d) => d.kind === 'videoinput');
    window.audioDevices = devices.filter((d) => d.kind === 'audioinput');
    return {
        videoDevices: window.videoDevices,
        audioDevices: window.audioDevices
    };
}

async function requestMediaStream(){
    const videoConfiguration = {
        maxWidth: 1280,
        maxHeight: 720,
        maxFramerate: 30,
    }

    window.cameraStream = await navigator.mediaDevices.getUserMedia({
        video: {
            deviceId: window.videoDevices[0].deviceId,
            width: {
                ideal: videoConfiguration.maxWidth,
            },
            height: {
                ideal:videoConfiguration.maxHeight,
            },
        },
    });
    window.microphoneStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: window.audioDevices[0].deviceId },
    });
}