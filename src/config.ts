import AWS from 'aws-sdk';
import {Role, SignalingClient} from "amazon-kinesis-video-streams-webrtc";

export const APP_STRUCTURE = {
    REGION: 'us-west-2',
    ACCESS_KEY: 'AKIATDLD55P2443PFW6H',
    SECRET_KEY: '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',
    LOCAL_VIDEO: 'local-video',
    REMOTE_VIDEO: 'remote-video',
    CHANNEL_NAME: 'test-channel',
};

const kinesisVideoClient = new AWS.KinesisVideo({
    region: APP_STRUCTURE.REGION,
    accessKeyId: APP_STRUCTURE.ACCESS_KEY,
    secretAccessKey: APP_STRUCTURE.SECRET_KEY,
    correctClockSkew: true,
});

const kinesisVideoSignalingChannelsClient = (endpointsByProtocolHTTPS : string) => new AWS.KinesisVideoSignalingChannels({
    region: APP_STRUCTURE.REGION,
    accessKeyId: APP_STRUCTURE.ACCESS_KEY,
    secretAccessKey: APP_STRUCTURE.SECRET_KEY,
    correctClockSkew: true,
    endpoint: endpointsByProtocolHTTPS,
});

const getSignalingChannelEndpointResponse =  async (channelARN: string) => await kinesisVideoClient
    .getSignalingChannelEndpoint({
        ChannelARN: channelARN,
        SingleMasterChannelEndpointConfiguration: {
            Protocols: ['WSS', 'HTTPS'],
            Role: Role.VIEWER,
        },
    })
    .promise();

const endpointsByProtocol = async (channelARN: string) => {
    const endpoints =   await getSignalingChannelEndpointResponse(channelARN)
    return endpoints.ResourceEndpointList.reduce((endpoints, endpoint) => {
        endpoints[endpoint.Protocol] = endpoint.ResourceEndpoint;
        return endpoints;
    }, {});
}

const getIceServerConfigResponse = async (endpointsByProtocolHTTPS : string , channelARN : string)=> {
    return await kinesisVideoSignalingChannelsClient(endpointsByProtocolHTTPS)
        .getIceServerConfig({
            ChannelARN: channelARN,
        })
        .promise();
}

const getIceSevers = async (endpointsByProtocolHTTPS : string , channelARN : string) => {
    const iceServers : any = [
        { urls: `stun:stun.kinesisvideo.${APP_STRUCTURE.REGION}.amazonaws.com:443` }
    ];
    const iceServerConfigResponses = await getIceServerConfigResponse(endpointsByProtocolHTTPS , channelARN);
    iceServerConfigResponses.IceServerList.forEach(iceServer =>
        iceServers.push({
            urls: iceServer.Uris ,
            username: iceServer.Username,
            credential: iceServer.Password,
        }),
    );
}

const signalingClient = ({channelARN , channelEndpoint , clientId} :
                         {channelARN : string , channelEndpoint : string , clientId : string }
)=> new SignalingClient({
    channelARN ,
    channelEndpoint,
    clientId,
    role: Role.VIEWER,
    region: APP_STRUCTURE.REGION,
    credentials: {
        accessKeyId: APP_STRUCTURE.ACCESS_KEY,
        secretAccessKey: APP_STRUCTURE.SECRET_KEY,
    },
    systemClockOffset: kinesisVideoClient.config.systemClockOffset,
})




export {
    kinesisVideoSignalingChannelsClient,
    kinesisVideoClient,
    getIceSevers,
    endpointsByProtocol,
    signalingClient
} ;