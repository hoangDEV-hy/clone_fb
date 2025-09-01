import express from "express";
import { authenticate } from "../middware/auth";
import { methods as model_ExtEssays, interactions } from "../models/interactions";
import { Response } from "express";
import multer from "multer";
import { methods as model_essays, Essays } from '../models/essays';
const upload = multer();
let route = express.Router();

route.post('/like', authenticate.user_auth, upload.none(), (req: any, res: Response) => {
    console.log(req.body)
    const id_user = req.admin.id;
    const { id_essays, classify, content } = req.body;
    interactions.create({
        id_user, id_essays, classify, content
    })
    res.send();
})

route.delete('/like', upload.none(), (req: any, res: Response) => {
    const id_essays = req.body.id_essays;
    interactions.destroy({ where: { id_essays } });
    res.send()
})

route.post('/share', authenticate.user_auth, async (req: any, res: Response): Promise<any> => {
    const { id_essay } = req.body;
    let essay = await Essays.findOne({
        where: { id: id_essay }
    });
    let contenObj = JSON.parse(essay!.contens);
    if (typeof contenObj === 'string') {
        contenObj = JSON.parse(contenObj);
    }
    const essays_tranforme = {
        text: contenObj.text,
        image: JSON.stringify(contenObj.image)
    }
    console.log(essay);
    res.render('contens/essay/Extend_essay', { essay: essay?.toJSON(), conten: essays_tranforme })
})

route.post('/share/save', authenticate.user_auth, upload.none(), async (req: any, res: Response): Promise<any> => {
    const { essayId_original } = req.body;
    const id_user = req.admin.id;
    await interactions.create({ id_user: id_user, id_essays: essayId_original, classify: 'share' });
})

route.delete('/share/delete', authenticate.user_auth, upload.none(), async (req: any, res: Response): Promise<any> => {
    const { id } = req.body;
    try {
        await model_essays.des(id);
    } catch (error) {
        res.send(error);
    }
    await model_ExtEssays.des({ id_essays: id });
})



export { route };