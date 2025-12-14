import express, { Request, Response } from "express"
import { methods as methodsNotifications } from "../models/notifications"
import { sendNotification } from '../socket/index';

let route = express.Router();


//post add a notification to notifications
route.post('/chat_member', async (req: Request, res: Response) => {
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
            sender_id: notification_value.sender_id,
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



route.delete('/chat_member', async (req: Request, res: Response): Promise<any> => {
    try {
        const { notificationId } = req.body as { notificationId: number };

        const result = await methodsNotifications.delete(notificationId);

        return res.json({ success: true, result });
    } catch (error) {
        return res.status(500).json({ success: false, error });
    }
});

export { route };