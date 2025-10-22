import express from "express";
let route = express.Router();
import { Request, Response } from "express";
import multer = require("multer");
const upload = multer();
import { contensChat } from "../models/chat/contensChat";
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
export { route }