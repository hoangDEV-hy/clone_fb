import express, { Request, Response } from "express"
import { methods as methodsNotifications } from "../models/notifications"
import { sendNotification } from '../socket/index';

let route = express.Router();


//post add a notification to notifications
route.post('/chat_member', async (req: Request, res: Response) => {
    const { notification_value }: any = req.body;
    let result = await methodsNotifications.create(notification_value);

    let notificationValue = {
        id: result.id,
        sender_id: notification_value.sender_id,
        receiver_id: notification_value.receiver_id,
        content: notification_value.content
    };
    sendNotification(notificationValue);
    res.json(result);
})

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