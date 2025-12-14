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
export function sendNotification(notificationValue: { id: number, sender_id: string, receiver_id: string; content: string }) {
    try {

        if (!ioInstance) return console.error("Socket.io not initialized");

        const socketId = active_users[notificationValue.receiver_id];
        if (socketId) {
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