import express from "express";
import { authenticate } from "../Middlewares/Auth";
import { Request, Response } from "express";
import multer from "multer";
import { InteractionController } from '../Constrollers/InteractionController';
import { PostsController } from '../Constrollers/PostsController';
import { transformPostServices } from "../Helpers/TransformerPost";
import throwError from "../Helpers/ThrowErrorOfRouter";
import ExtendRequest from "../Types/ExtendRequest";

// ============================================================
// INTERACTIONS ROUTES
// Responsibility: Define endpoints, attach middleware, call controller
// ============================================================

const upload = multer();
const router = express.Router();

router.post('/interactions/load', upload.none(), async (req: Request, res: Response): Promise<void> => {
    try {
        const { id_Posts, id_user } = req.body;
        if (id_Posts == null || id_Posts === '') {
            res.status(202).json({ ok: "khong co bai viet" });
            return;
        }
        const Posts_data = JSON.parse(id_Posts);
        if (!Array.isArray(Posts_data) || Posts_data.length === 0) {
            res.status(202).json({ ok: "khong co bai viet" });
            return;
        }
        if (!id_user) {
            res.status(401).json({ error: "khong co quyen" });
            return;
        }

        const interactions_data = await InteractionController.loadInteractions(Posts_data, id_user);
        res.json(interactions_data);
    } catch (err) {
        throwError(err, res);
    }
});

router.post('/like', async (req: Request, res: Response) => {
    try {
        await InteractionController.processLikes(req.body);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: true, message: 'Failed to process likes' });
    }
});

router.post('/share', authenticate.user_auth, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id_Post } = req.body;

        const post = await PostsController.selectPostById(id_Post);

        if (post === null) {
            res.status(500).send({ error: 'khong the tim bai viet' });
            return;
        }

        const postTransformer = transformPostServices.transformPostReturnContent(post);
        res.render('Contents/Post/ExtendPost', {
            Post: post.toJSON(),
            conten: postTransformer,
        });
    } catch (err) {
        throwError(err, res);
    }
});

router.post('/share/save', authenticate.user_auth, upload.none(), async (req: ExtendRequest, res: Response): Promise<void> => {
    try {
        const { PostId_original } = req.body;
        const id_user = req.admin?.id;
        let notification_value = req.body.notification_value;

        if (typeof notification_value === 'string') {
            notification_value = JSON.parse(notification_value);
        }

        if (!PostId_original || !notification_value) {
            res.status(400).json({ error: true, message: 'Missing required inputs' });
            return;
        }

        await InteractionController.saveShare(id_user!, PostId_original, notification_value);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: true, message: 'Failed to save share' });
    }
});

router.delete('/share/delete', authenticate.user_auth, upload.none(), async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.body;
        if (!id) {
            res.status(500).send({ error: "khong ton tai id post" });
            return;
        }
        await PostsController.delPost(id);
        await InteractionController.deleteShare(id);
        res.status(200).json({ success: true });
    } catch (error) {
        throwError(error, res);
    }
});

router.post('/Post/load', authenticate.user_auth, upload.none(), async (req: Request, res: Response): Promise<void> => {
    try {
        const { id_Post } = req.body;
        if (!id_Post) {
            res.status(500).send({ error: "khong ton tai id post" });
            return;
        }
        let post = await PostsController.selectPostWithUserAndGroup(id_Post);
        if (!post) {
            res.status(500).json({ error: 'Post khong ton tai' });
            return;
        }
        (post as any).contens = transformPostServices.transformPostReturnContent(post);
        res.json({ Post: post.toJSON() });
    } catch (err) {
        throwError(err, res);
    }
});

router.get('/iframe/commend', (req, res) => {
    res.render('Contents/Post/CommendPage', { layout: false });
});

router.post('/commend', async (req: Request, res: Response): Promise<void> => {
    try {
        const comments = Array.isArray(req.body) ? req.body : [req.body];
        if (comments.length === 0) {
            res.status(400).json({ error: true, message: 'Missing required inputs' });
            return;
        }
        for (const comment of comments) {
            if (!comment.notification_value) {
                res.status(400).json({ error: true, message: 'Missing notification data' });
                return;
            }
        }

        await InteractionController.saveComments(comments);
        res.status(200).json({ success: true, message: 'Comments saved successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: true, message: 'Failed to save comments' });
    }
});

router.post('/commend/del', async (req: Request, res: Response) => {
    try {
        const comments = Array.isArray(req.body) ? req.body : [req.body];
        if (comments.length === 0) {
            res.status(400).json({ error: true, message: 'Missing required inputs' });
            return;
        }
        for (const comment of comments) {
            if (!comment.notification_value) {
                res.status(400).json({ error: true, message: 'Missing notification data' });
                return;
            }
        }

        await InteractionController.deleteComments(comments);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: true, message: 'Failed to delete comments' });
    }
});

router.post('/commend/up', async (req: Request, res: Response) => {
    try {
        const updatedCommends = req.body;
        await InteractionController.updateComments(updatedCommends);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: true, message: 'Failed to update comments' });
    }
});

export default router;
