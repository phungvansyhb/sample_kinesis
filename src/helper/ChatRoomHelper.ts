import {IvschatClient} from "@aws-sdk/client-ivschat";
import {ChatMessage} from "aws-sdk/clients/connect";

export const chatClient = new IvschatClient({
    region: 'us-west-2',
    credentials: {
        accessKeyId: 'import.meta.env.VITE_AWS_ACCESS_KEY_ID',
        secretAccessKey: 'import.meta.env.VITE_AWS_SECRET_ACCESS_KEY',
    },

});

export function initEvent(chatConnection : any){
    chatConnection.on('message', (message: ChatMessage) => {
       console.log(message)
    });
}