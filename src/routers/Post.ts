import express from "express";
import { methods } from "../models/user";
import { Posts, methods as model_Posts } from "../models/Posts"
import { authenticate } from "../middware/auth";
import { Response, Request } from "express";
import { User } from "../models/user";
import { Group } from "../models/group";

let route = express.Router();

route.get('/', authenticate.user_auth, async (req: any, res: Response) => {
    const user = await methods.selectUser(req.admin.id);
    const group_id = req.session.currentGroupId;
    res.render('contens/Post/Post', { user: user.toJSON(), group_id: group_id });
})

route.post('/update', authenticate.user_auth, async (req: any, res: Response) => {
    const { PostId_curtain, PostId_original } = req.body;
    const post = await Posts.findOne({

        where: { id: PostId_curtain },
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
    let contens = JSON.parse(post!.contens);

    contens = {
        text: contens.text,
        //image: JSON.stringify(contens.image) // giữ nguyên object/array thay vì stringify
        image: contens.image
    };
    post!.contens = contens;
    let Post = post?.toJSON();
    if (Post.PostId_origin) res.render('contens/Post/Extend_Post', { Post: Post })
    else res.render('contens/Post/Post', { Post: Post })
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
import { methods as consto_Posts } from "../constrollers/Posts"
import { json } from "sequelize";


let uploadForm = multer({
    limits: {
        fieldSize: 10 * 1024 * 1024, // 10MB giới hạn cho mỗi field text
        fileSize: 20 * 1024 * 1024   // 20MB giới hạn cho mỗi file
    }
});

route.post('/save', uploadForm.none(), async (req: Request, res: Response): Promise<any> => {
    try {

        let { PostId_original, PostId_curtain, userId, groupId, conten, scope, think } = req.body;
        if (groupId === '') groupId = null;

        if (!PostId_curtain) await model_Posts.create({ PostId_origin: PostId_original, user_id: userId, group_id: groupId, contens: conten, scope: scope, think: think });
        else {
            await model_Posts.up({ PostId_original: PostId_original, contens: conten, scope: scope, think: think }, { id: PostId_curtain });
        }
        return res.json({ status: 'ok' });
    }
    catch (error) {
        console.log(error);
        return res.json(error);
    }
});
export { route };