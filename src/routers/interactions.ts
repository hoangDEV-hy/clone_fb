import express from "express";
import { authenticate } from "../Middlewares/Auth";
import { Request, Response } from "express";
import multer from "multer";
import { methods as interactionsController } from '../Constrollers/Interactions'
import throwError from "../Helpers/ThrowErrorOfRouter";
import { methods as postController } from '../Constrollers/Posts'
import { transformPostServices } from "../Helpers/TransformerPost";
import { addNotification, sendNotification } from '../Services/FollowerService';
import { sequelize } from '../Configs/Sql';


import NotificationServerTake from "../Types/Notification";
import ExtendRequest from "../Types/ExtendRequest";
import { interactions } from "../Models/Interactions";


const upload = multer();
let router = express.Router();



//interactions_load
router.post('/interactions/load', upload.none(), async (req: Request, res: Response): Promise<void> => {
    try {
        const { id_Posts, id_user } = req.body;
        if (id_Posts == null || id_Posts === '') {
            res.status(202).json({ ok: "không có bài viết" });
            return;
        }
        const Posts_data = JSON.parse(id_Posts);
        if (!Array.isArray(Posts_data) || Posts_data.length === 0) {
            res.status(202).json({ ok: "không có bài viết" });
            return;
        }
        //check id_Posts
        if (!id_user) {
            res.status(401).json({ error: "không có quyền" });
            return;
        }



        // --------------------------
        // Lấy số like và check user đã like chưa
        // --------------------------
        const sl_like_check = await interactionsController.selectLikeStatus(Posts_data, id_user);


        // Shares
        const sl_share = await interactionsController.selectedShareCount(Posts_data);


        // Comments
        const commend = await interactionsController.selectCommendData(Posts_data);


        // Send response
        let interactions_data = { sl_like_check, sl_share, commend };
        res.json(interactions_data);

    } catch (err) {
        throwError(err, res);
    }
});

router.post('/like', async (req: Request, res: Response) => {
    //trans des in db and in req.body
    const transaction = await sequelize.transaction();
    try {
        const likeData = req.body;

        // Validate input
        if (!likeData || Object.keys(likeData).length === 0) {
            res.status(400).json({ error: true, message: 'Missing required inputs' });
            return;
        }
        const notifications: NotificationServerTake[] = [];

        // Tách DELETE và POST
        const toDelete = Object.values(likeData)
            .filter((item: any) => item.method === 'DELETE')
            .map((item: any) => item.id_Posts);

        const toCreate = Object.values(likeData)
            .filter((item: any) => item.method === 'Post') as interactions[];

        // ===== DELETE likes =====
        if (toDelete.length > 0) {
            await interactionsController.destroyInteractions(toDelete, transaction);
        }

        // ===== CREATE likes =====
        if (toCreate.length > 0) {
            await interactionsController.createInteractions(toCreate, transaction);

            // Collect notifications
            toCreate.forEach((like: any) => {
                if (like.notification_value) {
                    notifications.push(like.notification_value);
                }
            });
        }

        // ===== Create notifications in transaction =====
        const notificationResults = await Promise.all(
            notifications.map(notif =>
                addNotification(notif, transaction)
            )
        );

        // ===== Commit transaction =====
        await transaction.commit();

        // ===== Send realtime notifications (after commit) =====
        notificationResults.forEach((result, index) => {
            if (result?.id) {
                sendNotification(
                    result.id,
                    notifications[index]
                );
            }
        });

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
});



router.post(
    '/share',
    authenticate.user_auth,
    async (req: Request, res: Response): Promise<void> => {
        const { id_Post } = req.body;

        const post = await postController.selectPostById(id_Post);

        if (post === null) {
            res.status(500).send({ error: 'khong the tim bai viet' });
            return;
        }

        const postTransformer = transformPostServices.transformPostReturnContent(post);
        res.render('Contents/Post/ExtendPost', {
            Post: post.toJSON(),
            conten: postTransformer,
        });
    }
);

router.post('/share/save', authenticate.user_auth, upload.none(), async (req: ExtendRequest, res: Response): Promise<void> => {
    const transaction = await sequelize.transaction();
    try {

        const { PostId_original } = req.body;
        const id_user = req.admin?.id;
        const notification_value =
            typeof req.body.notification_value === 'string'
                ? JSON.parse(req.body.notification_value)
                : req.body.notification_value;
        notification_value.selectedSenderId = id_user;
        notification_value.content = `${notification_value.content} ${id_user}`;
        // Validate input
        if (!PostId_original || !notification_value) {
            res.status(400).json({ error: true, message: 'Missing required inputs' });
            return;
        }
        // // Self share validation
        // const postOwner = await postController.getPostOwner(PostId_original);
        // if (postOwner && postOwner.id === userId) {
        //     res.status(400).json({
        //         error: true,
        //         message: 'You cannot share your own post with notification'
        //     });
        //     return;
        // }

        await interactionsController.createInteraction({ id_user: id_user, id_Posts: PostId_original, classify: 'share' }, transaction);
        // Create notification
        const notificationResult = await addNotification(
            notification_value,
            transaction
        );
        await transaction.commit();
        // Send realtime notification
        if (notificationResult?.id) {
            sendNotification(
                notificationResult.id,
                notification_value
            );
        }
        res.status(200).json({ success: true });
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
})

router.delete('/share/delete', authenticate.user_auth, upload.none(), async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.body;
        if (!id) {
            res.status(500).send({ error: "khong ton tai id post" });
        }
        await postController.delPost(id);
        await interactionsController.destroyInteractionByIdPost(id);
    } catch (error) {
        throwError(error, res);
    }
})

router.post('/Post/load', authenticate.user_auth, upload.none(), async (req: Request, res: Response): Promise<void> => {
    const { id_Post } = req.body;
    if (!id_Post) {
        res.status(500).send({ error: "khong ton tai id post" });
    }
    let post = await postController.selectPostWithUserAndGroup(id_Post);
    if (!post) {
        res.status(500).json({
            error: 'Post không tồn tại'
        });
        return;
    }
    (post as any).contens = transformPostServices.transformPostReturnContent(post);
    let Post = post?.toJSON();
    res.json({ Post });
})
router.get('/iframe/commend', (req, res) => {
    res.render('Contents/Post/CommendPage', { layout: false }); // view sẵn có HTML + CSS
});

router.post('/commend', async (req: Request, res: Response): Promise<void> => {
    const transaction = await sequelize.transaction();
    try {
        const comments = Array.isArray(req.body) ? req.body : [req.body];
        // Validate
        if (comments.length === 0) {
            res.status(400).json({ error: true, message: 'Missing required inputs' });
            return;
        }

        // Validate each comment has notification_value
        for (const comment of comments) {
            if (!comment.notification_value) {
                res.status(400).json({ error: true, message: 'Missing notification data' });
                return;
            }
        }
        
        // Loại bỏ notification_value trước khi lưu vào DB (vì không phải field của bảng interactions)
        // Đảm bảo id_Posts là number
        const commentsForDb = comments.map(comment => {
            const { notification_value, ...commentData } = comment;
            return {
                ...commentData,
                id_Posts: typeof commentData.id_Posts === 'string' ? parseInt(commentData.id_Posts) : commentData.id_Posts
            };
        });
        
        await interactionsController.createInteractions(commentsForDb, transaction);
        // ===== Create notifications =====
        const notificationResults = await Promise.all(
            comments.map(comment =>
                addNotification(
                    comment.notification_value,
                    transaction
                )
            )
        );
        // ===== Commit =====
        await transaction.commit();
        // ===== Send realtime notifications =====
        notificationResults.forEach((result, index) => {
            if (result?.id) {
                sendNotification(
                    result.id,
                    comments[index].notification_value
                );
            }
        });

        // Trả về response thành công
        res.status(200).json({ success: true, message: 'Comments saved successfully' });
    } catch (error) {
        await transaction.rollback();
        res.status(500).json({ error: true, message: 'Failed to save comments' });
    }
})

router.post('/commend/del', async (req: Request, res: Response) => {
    const transaction = await sequelize.transaction();
    try {
        const comments = Array.isArray(req.body) ? req.body : [req.body];

        // Validate
        if (comments.length === 0) {
            res.status(400).json({ error: true, message: 'Missing required inputs' });
            return;
        }

        // Validate each comment has notification_value
        for (const comment of comments) {
            if (!comment.notification_value) {
                res.status(400).json({ error: true, message: 'Missing notification data' });
                return;
            }
        }
        await interactionsController.destroyInteractions(req.body, transaction);
        // ===== Create notifications =====
        const notificationResults = await Promise.all(
            comments.map(comment =>
                addNotification(
                    comment.notification_value,
                    transaction
                )
            )
        );
        // ===== Commit =====
        await transaction.commit();
        // ===== Send realtime notifications =====
        notificationResults.forEach((result, index) => {
            if (result?.id) {
                sendNotification(
                    result.id,
                    comments[index].notification_value
                );
            }
        });
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
})

router.post('/commend/up', async (req: Request) => {
    //using the function 
    const updatedCommends = req.body;
    await Promise.all(updatedCommends.map((c: any) =>
        interactionsController.updateInteraction(c.id, c.content)
    ));

})

export { router };