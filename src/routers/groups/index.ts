import express from 'express'
import { authenticate } from '../../Middlewares/Auth'
import { GroupController } from '../../Constrollers/GroupController'
import throwError from '../../Helpers/ThrowErrorOfRouter';

// ============================================================
// GROUP PAGE ROUTES
// Responsibility: Define endpoints, attach middleware, call controller
// ============================================================

const router = express.Router();

router.get('/create', authenticate.user_auth, (req: any, res: any) => {
    res.render('Contents/Groups/register');
});

router.get('/main', authenticate.user_auth, authenticate.currentGroup, async (req: any, res: any) => {
    try {
        const id = req.admin.id;

        let joinGroup = await GroupController.joinGroup_list(id);
        joinGroup = joinGroup.map((f: any) => f.toJSON());
        const PostsAll = await GroupController.PostsAll_group(id);

        const allPosts = PostsAll.flatMap((f: any) => f.Posts || []);

        const tranAllPosts = allPosts.map((Post: any) => {
            const obj = Post.toJSON();
            obj.contens = JSON.parse(obj.contens);
            obj.contens = JSON.parse(obj.contens);
            obj.contens = {
                text: obj.contens.text,
                image: JSON.stringify(obj.contens.image)
            };
            return obj;
        });

        res.render('Contents/Groups/Main', { groups: joinGroup, Posts: tranAllPosts })
    } catch (error) {
        throwError(error, res);
    }
})

export default router;
