import express from "express";
let route = express.Router();
import { Request, Response } from "express";
import multer = require("multer");
const upload = multer();
import { contensChat } from "../models/chat/contensChat";
import { config_chatFunc } from "../models/configs/config_chat";
import { createOrUpdateOrLoad_chat } from "../constrollers/chat"
import { Op } from "sequelize";
interface del_mesData {
    id: number,
    author: string
}
route.post('/del', upload.none(), async (req: Request, res: Response) => {
    try {
        let del_mesData = req.body.del_mesData;

        // Parse JSON from form-data
        if (typeof del_mesData === 'string') {
            del_mesData = JSON.parse(del_mesData);
        }

        console.log('req:', del_mesData);


        const ids = del_mesData

        // Delete from DBs
        await contensChat.destroy({
            where: {
                id: { [Op.in]: ids }
            }
        });

        res.send({ result: 'success' });
    } catch (e) {
        console.error(e);
        res.status(500).send({ result: 'fail' });
    }
});
route.post('/config', async (req: Request, res: Response) => {
    const { chat_id, author, name: nickName } = req.body;
    console.log("data", chat_id, author, nickName)
    const save_data: any = await createOrUpdateOrLoad_chat({ chat_id, author }, { nickName }, { chat_id, author, nickName });
    console.log("save_data", save_data);
    res.send({ "save_data": save_data.toJSON() });
})
export { route }