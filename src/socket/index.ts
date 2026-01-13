import { Server } from "socket.io";
import { config_dataChat } from "./chat"

let active_users: any = [];
let ioInstance: Server;
export function setup_chat(io: Server) {
    ioInstance = io;
    io.on('connection', (socket) => {

        socket.on('register', (user_id) => {
            active_users[user_id] = socket.id;
            console.log(`⚡ User${user_id} connected: ${socket.id}`);
        })
        //sending chatData to client
        config_dataChat.get_chatData(socket);
        //listening mesData to server and emit mesData to client
        config_dataChat.getAndSend_mesData(socket, io, active_users);

        //emit mesData to client
        socket.emit('get_chatData',)

        //defaultJoinLeaveChatRoom
        socket.on('defaultJoinChatRoom', (idChat) => {
            socket.join(idChat);
        })
        socket.on('defaultLeaveChatRoom', (idChat) => {
            for (const room of socket.rooms) {
                if (room !== idChat) {
                    socket.leave(room);
                    console.log(`Đã rời khỏi phòng: ${room}`);
                }
            }
        })
        //join chat room send notification to chat
        //config_dataChat.joinChatRoomAndSendNotificationsChat(socket);

        socket.on('disconnect', () => {
            for (const userId in active_users) {
                if (active_users[userId] === socket.id) {
                    delete active_users[userId];
                    break;
                }
            }
        })


    })

}
//for sending a notification
export function sendNotification(notificationValue: { id: number, selectedIdChatRoom: string, selectedSenderId: string, receiver_id: string; content: string }) {
    try {

        if (!ioInstance) return console.error("Socket.io not initialized");

        const socketId = active_users[notificationValue.receiver_id];
        if (socketId) {
            console.log('Active users:', active_users);
            console.log('Receiver ID:', notificationValue.receiver_id);
            console.log('Socket ID:', socketId);
            ioInstance.to(socketId).emit('create_notification', notificationValue);
            console.log('Sent notification to user screen');
        } else {
            console.log('Send to notification center instead');
        }
    } catch (err) {
        console.log("Lỗi khi gửi thông báo đến client", err);
        throw err;
    }
}