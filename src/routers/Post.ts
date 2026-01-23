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


route.post('/update', authenticate.user_auth, async (req: Request, res: Response): Promise<void> => {
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

route.post('/delete', authenticate.user_auth, async (req: Request, res: Response): Promise<void> => {
    try {

        const { PostId_curtain } = req.body;
        if (!PostId_curtain) {
            res.status(400).json({
                message: 'PostId_curtain is required'
            });
            return;
        }
        const result = await postController.delPost(PostId_curtain);
        if (result === 0) {
            res.status(500).json({
                message: 'Post not found'
            });
            return;
        }
        res.redirect('/main');
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

route.post('/save', authenticate.user_auth, uploadForm.none(), async (req: ExtendRequest, res: Response): Promise<void> => {
    try {
        const selectedUserId = req.admin?.id;
        if (!selectedUserId) {
            res.status(403).json({
                status: 'error',
                message: 'Bạn không có quyền chia sẻ hoặc lưu bài viết'
            });
            return;
        }
        let { PostId_original, PostId_curtain, groupId, content, scope, think } = req.body;
        if (PostId_original === '') PostId_original = null;

        if (!PostId_curtain) await postController.create(PostId_original, selectedUserId, groupId, content, scope, think);
        else {
            await postController.update(PostId_original, PostId_curtain, content, scope, think);
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