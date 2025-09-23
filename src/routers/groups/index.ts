import express from 'express'
import { authenticate } from '../../middware/auth'
import { methods } from '../../models/group';
import { methods as group } from '../../constrollers/group/group'
const router = express.Router();

router.get('/create', authenticate.user_auth, (req: any, res: any) => {
    res.render('contens/groups/register');
});
router.get('/', authenticate.user_auth, authenticate.adminGroup_auth, async (req: any, res: any) => {
    try {

        const id = 1;
        const group = await methods.select(id); // cần await
        req.session.currentGroupId = id;
        res.json(group?.toJSON()); // ?. để tránh undefined
    } catch (error) {
        console.log(error);
    }
    //const id=req.body;
});

router.get('/main', authenticate.user_auth, async (req: any, res: any) => {
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
        console.log(joinGroup)


        res.render('contens/groups/main', { groups: joinGroup, Posts: tranAllPosts })

    } catch (error) {
        console.log(error);
    }
})


export { router };