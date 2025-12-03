import express, { Request, Response } from "express"
import { methods as methodsNotifications } from "../models/notifications"
import { sendNotification } from '../socket/index';

let route = express.Router();


//post add a notification to notifications
route.post('/chat_member', async (req: Request) => {
    const { notification_value }: any = req.body;
    let result = await methodsNotifications.create(notification_value);

    let notificationValue = {
        receiver_id: notification_value.receiver_id,
        content: notification_value.content
    };
    sendNotification(notificationValue);
})

export { route };