import AWS from 'aws-sdk';

AWS.config.update({
    region: 'us-west-2',
    accessKeyId: process.env.accessKeyId,
    secretAccessKey: process.env.secretAccessKey,
});

const kinesisVideo = new AWS.KinesisVideo({
    correctClockSkew: true,
});

export default kinesisVideo;