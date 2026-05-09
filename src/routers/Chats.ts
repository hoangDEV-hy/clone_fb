import express from "express";
import { Request, Response } from "express";
import multer = require("multer");
import { ChatController } from "../Constrollers/ChatController";
import throwError from "../Helpers/ThrowErrorOfRouter";

// ============================================================
// CHAT ROUTES
// Responsibility: Define endpoints, attach middleware, call controller
// ============================================================

const upload = multer();
const router = express.Router();

router.post('/del', upload.none(), async (req: Request, res: Response) => {
    try {
        let del_mesData = req.body.del_mesData;

        if (typeof del_mesData === 'string') {
            del_mesData = JSON.parse(del_mesData);
        }

        await ChatController.deleteMessages(del_mesData);
        res.send({ result: 'success' });
    } catch (e) {
        console.error(e);
        res.status(500).send({ result: 'fail' });
    }
});

router.post('/config', async (req: Request, res: Response) => {
    try {
        const { chat_id, author, name: nickName } = req.body;
        const save_data = await ChatController.createOrUpdateChatConfig(chat_id, author, nickName);
        if (save_data) {
            res.send({ "save_data": save_data.toJSON() });
        }
    } catch (e) {
        console.error(e);
        res.status(500).send({ result: 'fail' });
    }
});

router.get('/chat_room/people', (req: Request, res: Response) => {
    res.render('Contents/Search');
});

router.post('/chat_room/people', async (req: Request, res: Response) => {
    try {
        const { chat_memberValue } = req.body;
        const result = await ChatController.addChatMember(chat_memberValue);
        res.json(result);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: true, message: 'Failed to add chat member' });
    }
});

router.delete('/chat_room/people', async (req: Request, res: Response): Promise<any> => {
    try {
        const chat_memberValue = req.body;
        const result = await ChatController.removeChatMember(chat_memberValue);
        return res.json({ success: true, result });
    } catch (error) {
        console.error("UPDATE ERROR:", error);
        return res.status(500).json({ success: false, error });
    }
});

router.patch('/chat_room/people', async (req: Request, res: Response): Promise<any> => {
    try {
        const chat_memberValue = req.body;
        const result = await ChatController.updateChatMember(chat_memberValue);
        return res.json({ success: true, result });
    } catch (error) {
        console.error("UPDATE ERROR:", error);
        return res.status(500).json({ success: false, error });
    }
});

export default router;
