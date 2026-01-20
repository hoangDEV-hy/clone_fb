import express from "express";
import { authenticate } from "../middware/auth";
import { Response, Request } from "express";
import { methods as postController } from "../constrollers/Posts";
import throwError from "../helpers/ThrowErrorOfRouter";

import ExtendRequest from "../types/Type_ExtendRequest";
let route = express.Router();

route.get(
    '/',
    authenticate.user_auth,
    async (req: ExtendRequest, res: Response): Promise<void> => {
        try {
            const selectedIdUser = req.admin?.id;
            const selectedGroupId = req.session?.currentGroupId;
            if (!selectedIdUser) {
                res.status(401).send('Unauthorized');
                return;
            }

            if (!selectedGroupId) {
                res.status(400).send('Group not found');
                return;
            }

            const user = await postController.selectUser(selectedIdUser);
            if (!user) {
                res.status(401).send('Unauthorized');
                return;
            } else {
                res.render('contens/Post/Post', {
                    user: user.toJSON(),
                    group_id: selectedGroupId
                });
            }
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
        }
    }
);


route.post('/update', authenticate.user_auth, async (req: any, res: Response): Promise<void> => {
    try {

        const { PostId_curtain } = req.body;
        if (!PostId_curtain) {
            res.status(400).json({
                message: 'PostId_curtain is required'
            });
            return;
        }
        const post = await postController.selectPostWithUserAndGroup(PostId_curtain);
        if (!post) {
            res.status(404).json({
                message: 'Post not found'
            });
            return;
        }
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
    } catch (err) {
        throwError(err, res);
    }
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




let uploadForm = multer({
    limits: {
        fieldSize: 10 * 1024 * 1024, // 10MB giới hạn cho mỗi field text
        fileSize: 20 * 1024 * 1024   // 20MB giới hạn cho mỗi file
    }
});

route.post('/save', uploadForm.none(), async (req: Request, res: Response): Promise<void> => {
    try {

        let { selectedPostIdOrigin, selectedPostIdCurtain, selectedUserId, selectedGroupId, selectedConten, selectedScope, selectedThink } = req.body;
        if (selectedPostIdOrigin === '') selectedPostIdOrigin = null;

        if (!selectedPostIdCurtain) await postController.create(selectedPostIdOrigin, selectedUserId, selectedGroupId, selectedConten, selectedScope, selectedThink);
        else {
            await postController.update(selectedPostIdOrigin, selectedPostIdCurtain, selectedConten, selectedScope, selectedThink);
        }
        res.status(200).json({
            status: 'ok',
            message: 'Lưu bài viết thành công'
        });
        return;
    }
    catch (error) {
        throwError(error, res);
    }
});
export { route };