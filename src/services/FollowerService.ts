import { methods as methodsNotifications } from '../models/notifications';
import { sendNotification as sendNotificationBySocket } from '../socket/index';
import { Transaction } from 'sequelize';

import NotificationServerTake from '../types/Type_Notification';
/* ===== Add notification (DB) ===== */
export async function addNotification(
    notification_value: NotificationServerTake,
    transaction?: Transaction
): Promise<{ id: number }> {
    const result = await methodsNotifications.create(
        notification_value,
        { transaction }
    );

    return {
        id: result.id
    };
}


export function sendNotification(
    id: number,
    notification_value: NotificationServerTake
): void {
    const notificationPayload = {
        id,
        selectedIdChatRoom: notification_value.selectedIdChatRoom,
        selectedSenderId: notification_value.selectedSenderId,
        receiver_id: notification_value.receiver_id,
        content: notification_value.content,
        type: notification_value.type
    };

    sendNotificationBySocket(notificationPayload);
}
