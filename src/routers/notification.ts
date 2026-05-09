import express, { Request, Response } from "express"
import { NotificationController } from '../Constrollers/NotificationController';
import { sendNotification } from '../Socket/index';

// ============================================================
// NOTIFICATION ROUTES
// Responsibility: Define endpoints, attach middleware, call controller
// ============================================================

const router = express.Router();

router.post('/chat_members', async (req: Request, res: Response) => {
    const { notification_value } = req.body || {};

    if (!notification_value) {
        res.status(400).json({
            error: true,
            message: "thiếu inputs"
        });
    }

    try {
        const result = await NotificationController.create(notification_value);

        const notificationValue = {
            id: result.id,
            selectedIdChatRoom: notification_value.selectedIdChatRoom,
            selectedSenderId: notification_value.selectedSenderId,
            receiver_id: notification_value.receiver_id,
            content: notification_value.content
        };

        try {
            //sendNotification(notificationValue);
        } catch (err) {
            console.error("Lỗi khi gửi thông báo đến client:", err);
        }

        res.status(200).json({ message: "thành công" });

    } catch (err) {
        console.error("🔥 Lỗi khi tạo notification:", err);
        res.status(500).json({
            error: true,
            message: "Có lỗi xảy ra khi tạo notification."
        });
    }
});

router.post("/admins", async (req: Request, res: Response): Promise<void> => {
    try {
        const { selectedValueNotificationAdmin } = req.body;

        if (!selectedValueNotificationAdmin) {
            res.status(400).json({ message: "Missing notification data" });
            return;
        }

        const result = await NotificationController.create(selectedValueNotificationAdmin);

        const notificationValue = {
            id: result.id,
            selectedIdChatRoom: '',
            selectedSenderId: selectedValueNotificationAdmin.selectedSenderId,
            receiver_id: selectedValueNotificationAdmin.receiver_id,
            content: selectedValueNotificationAdmin.content
        }

        try {
            //sendNotification(notificationValue);
        } catch (err) {
            console.error("Error while sending notification to client:", err);
        }

        res.status(200).json({ success: true, message: "Success" });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Failed to send message to admin"
        });
    }
});

router.post('/notificationcenter', async (req: Request, res: Response): Promise<void> => {
    try {
        const { selectedUserID, page } = req.body as {
            selectedUserID: string;
            page: number;
        };

        const result = await NotificationController.getNotificationCenter(selectedUserID, page);

        res.json({ success: true, result });
    } catch (error) {
        console.error('router /notificationcenter error:', error);
        res.status(500).json({ success: false });
    }
});

router.delete('/notification', async (req: Request, res: Response): Promise<any> => {
    try {
        const { notificationId } = req.body as { notificationId: number };

        const result = await NotificationController.delete(notificationId);

        return res.json({ success: true, result });
    } catch (error) {
        return res.status(500).json({ success: false, error });
    }
});

export default router;
