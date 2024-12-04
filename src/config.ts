import AWS from 'aws-sdk';

// Cấu hình AWS SDK
AWS.config.update({
    region: 'us-west-2',
    accessKeyId: 'import.meta.env.accessKeyId',
    secretAccessKey: 'import.meta.env.secretAccessKey'
});

const ivs = new AWS.IVS()

async function createIvsChannel(){
    const params = {
        name: 'MyChannel', // Tên kênh
        latencyMode: 'LOW', // Chế độ độ trễ
        type: 'BASIC' // Loại kênh
    };

    try {
        return await ivs.createChannel(params).promise();
        // get channel url by data.channel.playbackUrl;
        // data.channel.arn; // Trả về ARN của kênh
    } catch (error) {
        console.error('Error creating channel:', error);
    }
};

