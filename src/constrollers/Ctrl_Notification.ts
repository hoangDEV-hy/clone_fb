import { Transaction } from 'sequelize';
import throwError from '../helpers/ThrowErrorOfSqlQuery';
import { methods as notificationModels, notifications } from '../models/notifications'
import NotificationServerTake from '../types/Type_Notification';



export async function getNotificationCenter(
    userId: string,
    page: number
): Promise<{
    list: notifications[];
    unreadCount: number;
}> {
    const PAGE_SIZE = 10;
    const offset = (page - 1) * PAGE_SIZE;
    try {
        return await notificationModels.selectNotificationsAndQuantity(
            userId,
            PAGE_SIZE,
            offset
        );
    }
    catch (error) {
        throw error;
    }
}
export async function getNotificationsChat(chatId: number, receiverId: string): Promise<notifications[] | null> {
    try {
        return await notificationModels.getNotificationsChat(chatId, receiverId);
    } catch (err) {
        throwError(err);
    }
}
export async function create(notification_value: NotificationServerTake, transaction?: Transaction): Promise<notifications> {
    try {
        return await notificationModels.create(notification_value, { transaction });
    } catch (err) {
        throwError(err);
    }
}