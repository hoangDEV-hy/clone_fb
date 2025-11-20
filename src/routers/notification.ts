import express, { Request, Response } from "express"
import { methods as methodsNotifications } from "../models/notifications"


let route = express.Router();


//post add a notification to notifications
route.post('/chat_member', async (req: Request) => {
    const { notification_value }: any = req.body;
    let result = await methodsNotifications.create(notification_value);
    console.log("notification_value", result);
})

export { route };