import { Socket } from 'socket.io'
import { select_chats, create_mes } from '../constrollers/chat'
export let config_dataChat = {
    get_chatData: (socket: Socket) => {
        socket.on('get_chatData', async (sender_id, receiver_id, callback) => {
            let select_chatsData = await select_chats(sender_id, receiver_id);
            if (select_chatsData !== true) {
                callback(select_chatsData)
            }
            else
                callback('Create successfully')
        });
    },
    getAndSend_mesData: (socket: Socket, io: any, active_users: any[]) => {
        socket.on('send_mes', async (send_mesData, chatId, author, receiver_id) => {
            console.log("chatId", chatId, "author", author)
            console.log("send_mesData", send_mesData);
            try {

                const saverMes = await create_mes(chatId, author, send_mesData);
                console.log(saverMes)
                // Phát lại cho người gửi (xác nhận)
                if (active_users[author]) {
                    io.to(active_users[author]).emit('receive_mes', saverMes, author);
                }

                // Phát lại cho người nhận (nếu đang online)
                if (active_users[receiver_id]) {
                    io.to(active_users[receiver_id]).emit('receive_mes', saverMes, receiver_id);
                }
            }
            catch (e) {
                console.log('errol', e);
            }
        })
    }
}
