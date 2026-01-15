import { Server } from 'socket.io';
import { methods as methodsNotifications } from '../../models/notifications';
import NotificationServerTake from '../../types/Type_Notification';

export async function sendNotificationWhenOnline(
    ioInstance: Server,
    socketId: string,
    notification: NotificationServerTake
): Promise<NotificationServerTake> {
    const socket = ioInstance.sockets.sockets.get(socketId);

    if (!socket) {
        console.error(`Socket ${socketId} not found`);
        return notification;
    }

    // Emit notification
    socket.emit('create_notification', notification);

    // Lắng nghe 1 lần duy nhất (tránh memory leak)
    socket.once(
        'notification_clicked',
        async (received: boolean) => {
            try {
                if (received) {
                    await methodsNotifications.delete(notification.id);
                } else {
                    socket.emit('badge_increment', 1);
                }
            } catch (err) {
                console.error('Notification handle error:', err);
            }
        }
    );

    return notification;
}