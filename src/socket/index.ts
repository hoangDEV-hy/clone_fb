import { Server } from "socket.io";
import { sendNotificationWhenOnline } from '../services/SendNotificationServices/WhenOnline'
import { ChatSocket } from "./chat";

import NotificationServerTake from "../types/Type_Notification";
let active_users: any = [];
let ioInstance: Server;
export function setup_chat(io: Server) {
    ioInstance = io;
    io.on('connection', (socket) => {

        socket.on('register', (user_id) => {
            active_users[user_id] = socket.id;
            console.log(`⚡ User${user_id} connected: ${socket.id}`);
        })

        ChatSocket.sendMessage(socket, io, active_users);
        ChatSocket.deleteMessage(socket, io);
        ChatSocket.inviteMembers(socket, io);
        ChatSocket.handleInventMember(socket, io);
        ChatSocket.removeMember(socket, io);
        ChatSocket.updateConfig(socket, io);
        ChatSocket.transferAdmin(socket, io);
        ChatSocket.typingIndicator(socket, io);

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
export function sendNotification(
    notificationValue: NotificationServerTake
): void {
    try {
        if (!ioInstance) {
            console.error('Socket.io not initialized');
            return;
        }

        const socketId = active_users[notificationValue.receiver_id];

        if (!socketId) {
            console.log(
                'User offline, send to notification center instead'
            );
            return;
        }

        sendNotificationWhenOnline(ioInstance, socketId, notificationValue);

        console.log(
            `Notification sent to user ${notificationValue.receiver_id}`
        );
    } catch (err) {
        console.error(
            'Lỗi khi gửi thông báo đến client:',
            err
        );
        throw err;
    }
}