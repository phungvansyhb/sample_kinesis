import {
    CreateChatTokenCommand,
    CreateChatTokenCommandInput,
    CreateRoomCommand,
    CreateRoomRequest,
    DeleteRoomCommand,
    DeleteRoomRequest,
    GetRoomCommand,
    IvschatClient,
    SendEventCommand,
    SendEventRequest
} from "@aws-sdk/client-ivschat";

import {ChatRoom,} from 'amazon-ivs-chat-messaging';


type ClaimRoomToken = {
    roomArn : string,
    user: {
        id : string ,
        name : string ,
        avatar : string
    },
    role : 'host'|'viewer'
}

export const SDKClient = new IvschatClient({
    region: import.meta.env.VITE_REGION,
    credentials: {
        accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
        secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
    },

});

export async function createRoomToken({user, roomArn, role}:ClaimRoomToken){
    const input : CreateChatTokenCommandInput = {
        roomIdentifier: roomArn,
        userId: user.id,
        attributes: {
            username: user.name,
            avatar: user.avatar,
        },
        capabilities: role === 'host' ? ['SEND_MESSAGE', 'DELETE_MESSAGE', 'DISCONNECT_USER'] : ['SEND_MESSAGE'],
    }
    const command = new CreateChatTokenCommand(input);
    return await SDKClient.send(command);
}

export async function createRoomChat(roomName : string){
    const input : CreateRoomRequest = {
        name: roomName,
        maximumMessageRatePerSecond: 10,
        maximumMessageLength: 5000,
    }
    const command = new CreateRoomCommand(input);
    return await SDKClient.send(command);

}

export async function deleteRoom(roomArn : string){
    const input:DeleteRoomRequest = {
        identifier : roomArn
    }
    const command = new DeleteRoomCommand(input);
    return await SDKClient.send(command);
}


export async function getRoom(roomArn : string){
    const command = new GetRoomCommand({identifier : roomArn});
    return await SDKClient.send(command);
}


/* for frontend */

export async function createConnectionToRoom(claimRoomToken : ClaimRoomToken){
    return new ChatRoom({
        regionOrUrl: import.meta.env.VITE_AWS_REGION,
        tokenProvider: async () => {
            const token = await createRoomToken(claimRoomToken);
            return {
                token: token.token,
                tokenExpirationTime: new Date(token.tokenExpirationTime),
                sessionExpirationTime: new Date(token.sessionExpirationTime)
            }
        }
    })
}