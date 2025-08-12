import express from "express";
import { methods } from "../models/user";
import { authenticate } from "../middware/auth";
import { Response, Request } from "express";

let route = express.Router();

route.get('/', authenticate, async (req: any, res: Response) => {
    const user = await methods.selectUser(req.admin.id);
    const group_id = req.session.currentGroupId;
    console.log(user)
    res.render('contens/essay', { user: user.toJSON(), group_id: group_id });
})
import multer from 'multer';


let uploadfile = multer({ storage: multer.memoryStorage() });

route.post('/upload', uploadfile.single('file'), (req: any, res) => {
    const mimeType = req.file.mimetype;
    const base64 = req.file.buffer.toString('base64');

    res.json({
        mimeType,
        base64
    });
});
import { methods as consto_essays } from "../constrollers/essays"
import { methods as model_essays } from "../models/essays"

let uploadForm = multer({
    limits: {
        fieldSize: 10 * 1024 * 1024, // 10MB giới hạn cho mỗi field text
        fileSize: 20 * 1024 * 1024   // 20MB giới hạn cho mỗi file
    }
});

route.post('/save', uploadForm.none(), async (req: Request, res: Response): Promise<any> => {
    try {

        const { userId, groupId, conten } = req.body;
        const contenObj = JSON.stringify(conten);
        await model_essays.create({ user_id: userId, group_id: groupId, contens: contenObj })

        return res.json({ status: 'ok' });
    }
    catch (error) {
        console.log(error);
        return res.json(error);
    }
});
export { route };