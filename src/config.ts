import AWS, {KinesisVideoSignalingChannels} from 'aws-sdk';
import {Role, SignalingClient, SigV4RequestSigner} from "amazon-kinesis-video-streams-webrtc";

export const APP_STRUCTURE = {
    REGION: 'us-west-2',
    ACCESS_KEY: 'AKIATDLD55P2443PFW6H',
    SECRET_KEY: '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',
    LOCAL_VIDEO: 'local-video',
    REMOTE_VIDEO: 'remote-video',
    CHANNEL_NAME: 'eya3',
    DATA_CHANNEL: 'chat-chit'
};

const kinesisVideoClient = new AWS.KinesisVideo({
    region: APP_STRUCTURE.REGION,
    accessKeyId: APP_STRUCTURE.ACCESS_KEY,
    secretAccessKey: APP_STRUCTURE.SECRET_KEY,
    correctClockSkew: true,
});



const getChannelARN = async (ChannelName : string) => {
    const channel = await kinesisVideoClient
        .describeSignalingChannel({ ChannelName})
        .promise();
    return channel.ChannelInfo?.ChannelARN || '';
};

const getSignalingChannelEndpointResponse =  async (role:Role,channelARN: string) => await kinesisVideoClient
    .getSignalingChannelEndpoint({
        ChannelARN: channelARN,
        SingleMasterChannelEndpointConfiguration: {
            Protocols: ['WSS', 'HTTPS'],
            Role: role,
        },
    })
    .promise();

const endpointsByProtocol = async (role:Role, channelARN: string) => {
    const endpoints =   await getSignalingChannelEndpointResponse(role, channelARN)
    return endpoints.ResourceEndpointList.reduce((endpoints, endpoint) => {
        endpoints[endpoint.Protocol] = endpoint.ResourceEndpoint;
        return endpoints;
    }, {}) as {HTTPS : string , WSS : string};
}

const kinesisVideoSignalingChannelsClient = (endpointsByProtocolHTTPS : string) => new AWS.KinesisVideoSignalingChannels({
    region: APP_STRUCTURE.REGION,
    accessKeyId: APP_STRUCTURE.ACCESS_KEY,
    secretAccessKey: APP_STRUCTURE.SECRET_KEY,
    correctClockSkew: true,
    endpoint: endpointsByProtocolHTTPS,
});

const getIceServerConfigResponse = async (kinesisVideoSignalingChannelsClient: KinesisVideoSignalingChannels ,endpointsByProtocolHTTPS : string , channelARN : string)=> {
    return await kinesisVideoSignalingChannelsClient
        .getIceServerConfig({
            ChannelARN: channelARN,
        })
        .promise();
}

const getIceSevers = async (kinesisVideoSignalingChannelsClient: KinesisVideoSignalingChannels, endpointsByProtocolHTTPS : string , channelARN : string) => {
    const iceServers : any = [
        { urls: `stun:stun.kinesisvideo.${APP_STRUCTURE.REGION}.amazonaws.com:443` }
    ];
    const iceServerConfigResponses = await getIceServerConfigResponse(kinesisVideoSignalingChannelsClient, endpointsByProtocolHTTPS , channelARN);
    iceServerConfigResponses.IceServerList.forEach(iceServer =>
        iceServers.push({
            urls: iceServer.Uris ,
            username: iceServer.Username,
            credential: iceServer.Password,
        }),
    );
    return iceServers
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

const signalingMaster = ({channelARN , channelEndpoint } :
                         {channelARN : string , channelEndpoint : string  }
)=> new SignalingClient({
    channelARN ,
    channelEndpoint,
    clientId : null,
    role: Role.MASTER,
    region: APP_STRUCTURE.REGION,
    credentials: {
        accessKeyId: APP_STRUCTURE.ACCESS_KEY,
        secretAccessKey: APP_STRUCTURE.SECRET_KEY,
        // sessionToken: sessionToken,
    },
    systemClockOffset: kinesisVideoClient.config.systemClockOffset,
    // requestSigner : {
    //     getSignedURL : async (signalingEndpoint, queryParams, date)=>{
    //         const signer = new SigV4RequestSigner(APP_STRUCTURE.REGION, {
    //             accessKeyId: APP_STRUCTURE.ACCESS_KEY,
    //             secretAccessKey: APP_STRUCTURE.SECRET_KEY,
    //             // sessionToken: this._clientArgs.sessionToken,
    //         });
    //         const signingStart = new Date();
    //         console.debug('Signing the url started at', signingStart);
    //         const retVal = await signer.getSignedURL(signalingEndpoint, queryParams, date);
    //         const signingEnd = new Date();
    //         console.debug( 'Signing the url ended at', signingEnd);
    //         console.debug( 'Signaling Secure WebSocket URL:', retVal);
    //         console.log('Time to sign the request:', signingEnd.getTime() - signingStart.getTime(), 'ms');
    //         return retVal;
    //     }
    // }
})


export {
    kinesisVideoSignalingChannelsClient,
    kinesisVideoClient,
    getIceSevers,
    endpointsByProtocol,
    signalingClient,
    signalingMaster,
    getChannelARN
} ;