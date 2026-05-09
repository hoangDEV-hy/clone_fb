import { NotificationController } from "./NotificationController";

// Backward compatibility - re-export as `methods`
export const methods = NotificationController;

// Export function for backward compatibility with old code
export async function getNotificationCenter(userId: string, page: number) {
    return NotificationController.getNotificationCenter(userId, page);
}
