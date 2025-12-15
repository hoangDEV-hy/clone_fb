import express, { Request, Response } from "express"
import { methods as methodsNotifications } from "../models/notifications"
import { sendNotification } from '../socket/index';

let route = express.Router();


//post add a notification to notifications
route.post('/chat_members', async (req: Request, res: Response) => {
    const { notification_value } = req.body || {};

    if (!notification_value) {
        res.status(400).json({
            error: true,
            message: "thiếu inputs"
        });
    }

    try {
        // Tạo notification trong DB
        const result = await methodsNotifications.create(notification_value);

        const notificationValue = {
            id: result.id,
            selectedIdChatRoom: notification_value.selectedIdChatRoom,
            selectedSenderId: notification_value.selectedSenderId,
            receiver_id: notification_value.receiver_id,
            content: notification_value.content
        };

        // Gửi realtime notification
        try {
            sendNotification(notificationValue);
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
//bat req( gui thong bao cho admin)-dung sendNotification gui lai cho admin



route.delete('/chat_members', async (req: Request, res: Response): Promise<any> => {
    try {
        const { notificationId } = req.body as { notificationId: number };

        const result = await methodsNotifications.delete(notificationId);

        return res.json({ success: true, result });
    } catch (error) {
        return res.status(500).json({ success: false, error });
    }
});

route.post("/admins", async (req: Request, res: Response): Promise<void> => {
    try {
        const { selectedValueNotificationAdmin } = req.body;

        if (!selectedValueNotificationAdmin) {
            res.status(400).json({ message: "Missing notification data" });
            return;
        }

        // Create notification in database
        const result = await methodsNotifications.create(
            selectedValueNotificationAdmin
        );

        const notificationValue = {
            id: result.id,
            selectedIdChatRoom: '',
            selectedSenderId: selectedValueNotificationAdmin.selectedSenderId,
            receiver_id: selectedValueNotificationAdmin.receiver_id,
            content: selectedValueNotificationAdmin.content
        }

        // Send realtime notification
        try {
            sendNotification(notificationValue);
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

export { route };