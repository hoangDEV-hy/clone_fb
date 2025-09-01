import express from "express";
import { methods } from "../models/user";
import { Essays, methods as model_essays } from "../models/essays"
import { authenticate } from "../middware/auth";
import { Response, Request } from "express";
import { User } from "../models/user";
import { Group } from "../models/group";

let route = express.Router();

route.get('/', authenticate.user_auth, async (req: any, res: Response) => {
    const user = await methods.selectUser(req.admin.id);
    const group_id = req.session.currentGroupId;
    console.log(group_id)
    res.render('contens/essay/essay', { user: user.toJSON(), group_id: group_id });
})

route.post('/update', authenticate.user_auth, async (req: any, res: Response) => {
    const { essayId_curtain, essayId_original } = req.body;
    const essays = await Essays.findOne({

        where: { id: essayId_curtain },
        include: [
            {
                model: User,
                as: 'users',
                required: false // inner join

            },
            {
                model: Group,
                as: 'groups',
                required: false
            }
        ]
    });
    let contens = JSON.parse(essays!.contens);

    contens = {
        text: contens.text,
        //image: JSON.stringify(contens.image) // giữ nguyên object/array thay vì stringify
        image: contens.image
    };
    essays!.contens = contens;
    let essay = essays?.toJSON();
    console.log(essay)
    if (essay.essayId_origin) res.render('contens/essay/Extend_essay', { essay: essay })
    else res.render('contens/essay/essay', { essay: essay })
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
import { json } from "sequelize";


let uploadForm = multer({
    limits: {
        fieldSize: 10 * 1024 * 1024, // 10MB giới hạn cho mỗi field text
        fileSize: 20 * 1024 * 1024   // 20MB giới hạn cho mỗi file
    }
});

route.post('/save', uploadForm.none(), async (req: Request, res: Response): Promise<any> => {
    try {

        let { essayId_original, essayId_curtain, userId, groupId, conten, scope, think } = req.body;
        if (groupId === '') groupId = null;

        if (!essayId_curtain) await model_essays.create({ essayId_origin: essayId_original, user_id: userId, group_id: groupId, contens: conten, scope: scope, think: think });
        else {
            await model_essays.up({ essayId_original: essayId_original, contens: conten, scope: scope, think: think }, { id: essayId_curtain });
            console.log("updated done")
        }
        return res.json({ status: 'ok' });
    }
    catch (error) {
        console.log(error);
        return res.json(error);
    }
});
export { route };