import {
    CreateChannelCommand,
    GetChannelCommand,
    GetStreamKeyCommand,
    IvsClient,
    ListStreamsCommand
} from "@aws-sdk/client-ivs";

const client = new IvsClient({
    region: 'us-west-2',
    credentials:{
        accessKeyId: import.meta.env.VITE_ACCESS_KEY_ID,
        secretAccessKey: import.meta.env.VITE_SECRET_KEY_ID
    }
});

export async function createIvsChannel(channelName : string){
    try {
        const command = new CreateChannelCommand({
            name : channelName,
            latencyMode : 'LOW',
            type: 'BASIC',

        });
        return await client.send(command);
    } catch (error) {
        window.alert("create channel error")
        console.log(error)
    }
};

export async function getIvsChannel(arnUrl : string){
    const command = new GetChannelCommand({arn : arnUrl});
    return  await client.send(command);
}

export async function getIvsStreamKey(arnUrl : string){
    const command = new GetStreamKeyCommand({arn : arnUrl});
    return await client.send(command);
}