import { Request, Response } from "express";
import { authenticate } from '../../Middlewares/Auth'
import express from "express"
import { methods as pageManagerPostController } from '../../Constrollers/PageManagers/Posts'
import { transformPostServices } from "../../Helpers/TransformerPost";

import ExtendRequest from "../../Types/ExtendRequest";
import throwError from "../../Helpers/ThrowErrorOfRouter";


let route = express.Router();

route.get('/', authenticate.user_auth, async (req: ExtendRequest, res: Response): Promise<void> => {
    try {
        // 1. Lấy dữ liệu từ request (có optional chaining)
        const selectedIdUser = req.admin?.id ?? null;
        const selectedIdGroup = req.session?.currentGroupId ?? null;

        // 2. Xác định quyền admin
        const isAdmin: boolean = req.session?.admin ? true : false;

        // 3. Validate dữ liệu đầu vào
        if (!selectedIdUser) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }

        if (!selectedIdGroup) {
            res.status(400).json({ message: 'Group not selected' });
            return;
        }

        const selectedGroup = await pageManagerPostController.selectGroup(selectedIdGroup);
        if (!selectedGroup) {
            res.status(404).json({ message: 'Group not found' });
            return;
        }

        const transformer_post =
            await pageManagerPostController.loadPosts(
                selectedIdUser,
                selectedIdGroup
            );

        // 5. Render view
        return res.render('Contents/PageManages/Post', {
            groups: selectedGroup.toJSON(),
            Posts: transformer_post,
            isAdmin: isAdmin
        });

    } catch (err) {
        throwError(err, res);
    }
})

route.delete(
    '/del',
    authenticate.user_auth,
    async (req: Request, res: Response): Promise<void> => {
        try {
            const isAdmin: boolean = req.session?.admin ? true : false;

            if (!isAdmin) {
                res.status(401).send('dont allowed');
                return;
            }

            const { id } = req.body;
            if (!id) {
                res.status(400).send('ID is required');
                return;
            }

            await pageManagerPostController.delPost(id);

            res.redirect('/');
        } catch (err) {
            throwError(err, res);
        }
    }
);

route.post('/update', async (req: Request, res: Response): Promise<void> => {
    try {

        const isAdmin: boolean = req.session?.admin ? true : false;
        if (isAdmin) res.redirect('/');//update
        else {
            res.status(401).send('dont allowed');
            return;
        }
    } catch (err) {
        throwError(err, res);
    }
})

route.get(
    '/sort',
    authenticate.user_auth,
    async (req: ExtendRequest, res: Response): Promise<void> => {
        try {
            const selectedIdUser = req.admin?.id;
            const selectedIdGroup = req.session?.currentGroupId;
            let sort: string = req.query.sort as string;

            if (!selectedIdUser) {
                res.status(401).send('Unauthorized');
                return;
            }

            if (!selectedIdGroup) {
                res.status(400).send('Group not selected');
                return;
            }

            if (!sort) sort = 'like';

            // ===== Query =====
            const post =
                await pageManagerPostController
                    .selectPostsWithFilter_InteractionAndUser(
                        selectedIdGroup,
                        'group',
                        sort,
                        selectedIdUser
                    );

            const group =
                await pageManagerPostController
                    .selectGroup(selectedIdGroup);

            if (!post || !group) {
                res.status(404).send('Data not found');
                return;
            }

            // ===== Transform =====
            const tranAllPosts = transformPostServices.transformPosts(post);

            res.render('Contents/PageManagers/Post', {
                Posts: tranAllPosts,
                group: group.toJSON()
            });

        } catch (err) {
            throwError(err, res);
        }
    }
);


route.get('/admin/Post/sort', async (req: ExtendRequest, res: Response): Promise<void> => {
    try {
        const isAdmin: boolean = req.session?.admin ? true : false;
        const selectedIdGroup = req.session?.currentGroupId;
        let sort: string = req.query.sort as string;
        if (!selectedIdGroup) {
            res.status(400).send('Group not selected');
            return;
        }

        if (!sort) sort = 'like';
        //for where in the query
        let post = await pageManagerPostController.selectPostsWithFilter_InteractionAndUser(selectedIdGroup, 'group', sort);
        const group =
            await pageManagerPostController.selectGroup(selectedIdGroup);

        if (!post || !group) {
            res.status(404).send('Data not found');
            return;
        }
        // ===== Transform =====
        const tranAllPosts = transformPostServices.transformPosts(post);

        return res.render('Contents/PageManagers/Post', {
            Posts: tranAllPosts,
            group: group?.toJSON(),
            isAdmin: isAdmin
        });
    } catch (err) {
        throwError(err, res);
    }

})
export { route };
