import { Server } from 'socket.io';
import { methods as methodsNotifications } from '../../models/notifications';

import NotificationServerTake from '../../types/Type_Notification'

export async function sendNotificationWhenOnline(
    ioInstance: Server,
    socketId: string,
    notification: NotificationServerTake
): Promise<NotificationServerTake> {
    // Lấy socket instance từ socketId
    const socket = ioInstance.sockets.sockets.get(socketId);

    if (!socket) {
        console.error(`Socket ${socketId} not found`);
        // Nếu socket không tồn tại, có thể emit badge_increment trực tiếp
        ioInstance.to(socketId).emit('badge_increment', 1);
        return notification;
    }

    // Dùng socket.emit() với callback để nhận acknowledgment
    socket.emit(
        'create_notification',
        notification
    );
    socket.on('notification_clicked', async (received)=>{
        if (received) {
            await methodsNotifications.delete(notification.id);
        } else {
            socket.emit('badge_increment', 1);
        }
    })

    return notification;
}