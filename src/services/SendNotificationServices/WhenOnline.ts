import { Server } from 'socket.io';
import { methods as methodsNotifications } from '../../models/notifications';

import NotificationServerTake from '../../types/Type_Notification'

export async function sendNotificationWhenOnline(
    ioInstance: Server,
    socketId: string,
    notification: NotificationServerTake
): Promise<NotificationServerTake> {
    ioInstance.to(socketId).emit(
        'create_notification',
        notification,
        async (ack: { received: boolean }) => {
            if (ack?.received) {
                await methodsNotifications.delete(notification.id);
            } else {
                ioInstance.to(socketId).emit(
                    'badge_increment',
                    1
                );
            }
        }
    );

    return notification;
}