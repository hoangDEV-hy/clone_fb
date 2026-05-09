import { Request, Response } from "express";
import { authenticate } from '../../Middlewares/Auth'
import express from "express"
import { PageManagerPostController } from '../../Constrollers/PageManagers/PageManagerPostController';
import { transformPostServices } from "../../Helpers/TransformerPost";

import ExtendRequest from "../../Types/ExtendRequest";
import throwError from "../../Helpers/ThrowErrorOfRouter";

// ============================================================
// PAGE MANAGER POST ROUTES
// Responsibility: Define endpoints, attach middleware, call controller
// ============================================================

const router = express.Router();

router.get('/', authenticate.user_auth, async (req: ExtendRequest, res: Response): Promise<void> => {
    try {
        const selectedIdUser = req.admin?.id ?? null;
        const selectedIdGroup = req.session?.currentGroupId ?? null;
        const isAdmin: boolean = req.session?.admin ? true : false;

        if (!selectedIdUser) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }

        if (!selectedIdGroup) {
            res.status(400).json({ message: 'Group not selected' });
            return;
        }

        const selectedGroup = await PageManagerPostController.selectGroup(selectedIdGroup);
        if (!selectedGroup) {
            res.status(404).json({ message: 'Group not found' });
            return;
        }

        const transformer_post =
            await PageManagerPostController.loadPosts(
                selectedIdUser,
                selectedIdGroup
            );

        return res.render('Contents/PageManagers/Post', {
            groups: selectedGroup.toJSON(),
            Posts: transformer_post,
            isAdmin: isAdmin
        });

    } catch (err) {
        throwError(err, res);
    }
})

router.delete('/del', authenticate.user_auth, async (req: Request, res: Response): Promise<void> => {
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

        await PageManagerPostController.delPost(id);

        res.redirect('/');
    } catch (err) {
        throwError(err, res);
    }
});

router.post('/update', async (req: Request, res: Response): Promise<void> => {
    try {
        const isAdmin: boolean = req.session?.admin ? true : false;
        if (isAdmin) res.redirect('/');
        else {
            res.status(401).send('dont allowed');
            return;
        }
    } catch (err) {
        throwError(err, res);
    }
})

router.get('/sort', authenticate.user_auth, async (req: ExtendRequest, res: Response): Promise<void> => {
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

        const post = await PageManagerPostController.selectPostsWithFilter_InteractionAndUser(
            selectedIdGroup, 'group', sort, selectedIdUser
        );

        const group = await PageManagerPostController.selectGroup(selectedIdGroup);

        if (!post || !group) {
            res.status(404).send('Data not found');
            return;
        }

        const tranAllPosts = transformPostServices.transformPosts(post);

        res.render('Contents/PageManagers/Post', {
            Posts: tranAllPosts,
            group: group.toJSON()
        });

    } catch (err) {
        throwError(err, res);
    }
});

router.get('/admin/Post/sort', async (req: ExtendRequest, res: Response): Promise<void> => {
    try {
        const isAdmin: boolean = req.session?.admin ? true : false;
        const selectedIdGroup = req.session?.currentGroupId;
        let sort: string = req.query.sort as string;
        if (!selectedIdGroup) {
            res.status(400).send('Group not selected');
            return;
        }

        if (!sort) sort = 'like';

        let post = await PageManagerPostController.selectPostsWithFilter_InteractionAndUser(selectedIdGroup, 'group', sort);
        const group = await PageManagerPostController.selectGroup(selectedIdGroup);

        if (!post || !group) {
            res.status(404).send('Data not found');
            return;
        }

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

export default router;
