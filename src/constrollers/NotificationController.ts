import { methods as notificationMethods, notifications } from '../Models/Notifications'

// ============================================================
// NOTIFICATION CONTROLLER
// Responsibility: Business logic for notification operations
// ============================================================

export const NotificationController = {
    /**
     * Get notification center with pagination
     */
    getNotificationCenter: async (
        userId: string,
        page: number
    ): Promise<{
        list: notifications[];
        unreadCount: number;
    }> => {
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
    },

    /**
     * Create notification
     */
    create: async (notification_value: any) => {
        try {
            return await notificationMethods.create(notification_value);
        } catch (error) {
            throw error;
        }
    },

    /**
     * Delete notification
     */
    delete: async (notificationId: number) => {
        try {
            return await notificationMethods.delete(notificationId);
        } catch (error) {
            throw error;
        }
    }
};
