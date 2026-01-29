import { methods as notificationMethods, notifications } from '../Models/Notifications'



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
        return await notificationMethods.selectNotificationsAndQuantity(
            userId,
            PAGE_SIZE,
            offset
        );
    }
    catch (error) {
        throw error;
    }
}