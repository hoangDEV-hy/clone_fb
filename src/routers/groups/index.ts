import express from 'express'
import { authenticate } from '../../Middlewares/Auth'
import { methods } from '../../Models/Group';
import { methods as group } from '../../Constrollers/Groups'
import throwError from '../../Helpers/ThrowErrorOfRouter';
const router = express.Router();

router.get('/create', authenticate.user_auth, (req: any, res: any) => {
    res.render('Contents/Groups/register');
});


router.get('/main', authenticate.user_auth, authenticate.currentGroup, async (req: any, res: any) => {
    try {
        const id = req.admin.id;

        let joinGroup = await group.joinGroup_list(id);
        joinGroup = joinGroup.map((f: any) => f.toJSON());
        const PostsAll = await group.PostsAll_group(id);



        // Lấy toàn bộ bài viết từ PostsAll (flatten)
        const allPosts = PostsAll.flatMap((f: any) => f.Posts || []);

        // Chuyển từng instance Sequelize thành object thuần và xử lý contens
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


export { router };