import AWS from 'aws-sdk';
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
        accessKeyId: 'import.meta.env.accessKeyId',
        secretAccessKey: 'import.meta.env.secretAccessKey'
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
        console.error('Error creating channel:', error);
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