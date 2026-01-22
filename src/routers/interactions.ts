import express from "express";
import { authenticate } from "../middware/auth";
import { Request, Response } from "express";
import multer from "multer";
import { methods as interactionsController } from '../constrollers/Ctrl_Interactions'
import throwError from "../helpers/ThrowErrorOfRouter";
import { methods as postController } from '../constrollers/Posts'
import { transformPost } from "../helpers/TransformerPost";


import ExtendRequest from "../types/Type_ExtendRequest";



const upload = multer();
let router = express.Router();



//interactions_load
router.post('/interactions/load', upload.none(), async (req: Request, res: Response): Promise<void> => {
    try {
        const { id_Posts, id_user } = req.body;
        if (!id_Posts) {
            res.status(202).json({ ok: "khong co bai viet" });
            return;
        }
        const Posts_data = JSON.parse(id_Posts);
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
    try {
        // Lấy danh sách ID cần xoá
        const idsToDelete = Object.values(req.body)
            .filter((item: any) => item.method === 'DELETE')
            .map((item: any) => item.id_Posts);
        // Xoá trong DB
        if (idsToDelete.length > 0) {
            await interactionsController.destroyInteractions(idsToDelete);
            for (const key of Object.keys(req.body)) {
                if (idsToDelete.includes(req.body[key].id_Posts)) {
                    delete req.body[key];
                }
            }
        }



    } catch (error) {
        console.log(error);
    }
    try {
        const dataToInsert: any = Object.values(req.body)
        await interactionsController.createInteractions(dataToInsert);
    } catch (error) {
        console.log(error);
    }

    res.send();
})



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

        const postTransformer = transformPost.transformPostReturnContent(post);

        res.render('contens/Post/Extend_Post', {
            Post: post.toJSON(),
            conten: postTransformer,
        });
    }
);

router.post('/share/save', authenticate.user_auth, upload.none(), async (req: ExtendRequest, res: Response): Promise<void> => {
    const { PostId_original } = req.body;
    const id_user = req.admin?.id;
    if (!id_user || !PostId_original) {
        res.status(500).send({ error: "idUser,idPost khong ton tai" });
        return;
    }
    await interactionsController.createInteraction({ id_user: id_user, id_Posts: PostId_original, classify: 'share' });
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
    (post as any).contens = transformPost.transformPostReturnContent(post);
    let Post = post?.toJSON();
    res.json({ Post });
})
router.get('/iframe/commend', (req, res) => {
    res.render('contens/Post/commend_page', { layout: false }); // view sẵn có HTML + CSS
});

router.post('/commend', upload.none(), (req: Request, res: Response): void => {
    if (req.body.length > 0) interactionsController.createInteractions(req.body);
    return;
})

router.post('/commend/del', upload.none(), (req: Request) => {
    //using the function destroy
    interactionsController.destroyInteractions(req.body);
})

router.post('/commend/up', upload.none(), async (req: Request) => {
    //using the function 
    const updatedCommends = req.body;
    await Promise.all(updatedCommends.map((c: any) =>
        interactionsController.updateInteraction(c.id, c.content)
    ));

})

export { router };