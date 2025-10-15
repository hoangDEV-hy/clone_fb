import { Socket } from 'socket.io'
import { select_chats } from '../constrollers/chat'
export let config_dataChat = {
    get_chatData: (socket: Socket) => {
        socket.on('get_chatData', async (receiver_id, callback) => {
            let select_chatsData = await select_chats(receiver_id);
            if (select_chatsData !== true) {
                callback(select_chatsData)
            }
            else
                callback('Create successfully')
        });
    },
    get_mesData: (socket: Socket)=>{
        socket.on('send_mes', (send_mesData, send_notification)=>{
            console.log("send_mesData",send_mesData);
            send_notification("da gui")
        })
    }
}
