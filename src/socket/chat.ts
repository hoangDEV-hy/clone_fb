import { Socket } from 'socket.io'
import { select_chats, create_mes } from '../Constrollers/Chats/Chats'
import { select_members, add_members } from '../Constrollers/Chats/ChatMembers'

//types
import { notifications } from '../Models/Notifications'


export let config_dataChat = {
    get_chatData: (socket: Socket) => {
        socket.on('get_chatData', async (sender_id, receiver_id, callback) => {
            try {
                let select_chatsData = await select_chats(sender_id, receiver_id);

                let result: any = {};

                if (Array.isArray(select_chatsData)) {
                    result.chat = {
                        message: 'Chat found',
                        data: select_chatsData
                    };
                } else if (select_chatsData.created) {
                    result.chat = {
                        message: 'Chat created successfully',
                        data: select_chatsData
                    };
                }
                let chat_id: number;

                if (Array.isArray(select_chatsData)) {
                    // Chat existed before, so use the first chat's id
                    chat_id = select_chatsData[0].id;
                } else {
                    // Chat was newly created
                    chat_id = select_chatsData.chatId;
                }
                let select_chatMembers = await select_members(sender_id, receiver_id, chat_id);
                console.log('select_chatMembers', select_chatMembers)

                // 3. Check members
                if (Array.isArray(select_chatMembers) && select_chatMembers.length > 0) {
                    result.members = {
                        message: 'Member of this chat found'
                    };
                } else {

                    let status = 'joining';
                    let chat_valueMembers = [{ chat_id: chat_id, idUser: sender_id, status: status }, { chat_id: chat_id, idUser: receiver_id, status: status }];
                    const created = await add_members(chat_valueMembers);

                    result.members = {
                        message: created
                            ? 'Add members of chat successfully' : 'Cannot add members'
                    };
                }

                // 4. Chỉ callback 1 lần
                return callback(result);

            } catch (err) {
                return callback({
                    message: 'Error: ' + err
                });
            }
        });
    },
    getAndSend_mesData: (socket: Socket, io: any, active_users: any[]) => {
        socket.on('send_mes', async (send_mesData, chatId, author, receiver_id) => {
            try {

                const saverMes = await create_mes(chatId, author, send_mesData);
                // Phát lại cho người gửi (xác nhận)
                if (active_users[author]) {
                    io.to(active_users[author]).emit('receive_mes', saverMes, author);
                }

                // Phát lại cho người nhận (nếu đang online)
                if (active_users[receiver_id]) {
                    io.to(active_users[receiver_id]).emit('receive_mes', saverMes);
                }
            }
            catch (e) {
                console.log('errol', e);
            }
        })
    },
    joinChatRoomAndSendNotificationsChat: (socket: Socket) => {
        socket.on('joinChatRoom', (idChat, selectedValueNotificationChat: notifications) => {
            socket.join(idChat);
            socket.in(idChat).emit('sendedNotificationChat', selectedValueNotificationChat)
        })
    }
}
