import { Request, Response } from "express";
import { Group, methods as model_group } from '../../models/Model_Group';
import { methods as model_Posts, Posts } from '../../models/Model_Post';
import { authenticate } from '../../middlewares/Mid_Auth'
import express from "express"
import { methods as model_user, User } from '../../models/Model_User';
import { sequelize } from '../../configs/sql';
let route = express.Router();
declare module "express-serve-static-core" {
    interface Request {
        admin?: {
            id: string
        },
        session?: {
            admin: string
        }
    }
}
interface contentOfPost {
    text: string,
    image: string
}
interface contain_posts extends Omit<Posts, 'contens'> {
    users?: User,
    contens: string | contentOfPost,
    groups?: Group
}


route.get('/', authenticate.user_auth, async (req: Request, res: Response): Promise<void> => {
    try {
        const idUser: string | undefined = req.admin?.id;
        const isAdmin: string | undefined = req.session?.admin;
        //const idGroup = req.session.currentGroupId;
        const idGroup = 1;
        //vi 1 group nhung nhieu bai viet nen khong chung du lieu dc
        let group: Group = await model_group.select(idGroup);
        let contain_posts: contain_posts[] = await Posts.findAll({
            where: { user_id: idUser, group_id: idGroup, scope: 'group' },
            include: [
                { model: User, as: 'users', required: true, right: true }]
        })
        const transformer_post: contain_posts[] = contain_posts.map((b: contain_posts) => {

            b = b.toJSON() as contain_posts;

            let contenObj: contentOfPost | string = b.contens;
            while (typeof contenObj === 'string') {
                contenObj = JSON.parse(contenObj);
            }

            b.contens = {
                text: contenObj.text,
                image: JSON.stringify(contenObj.image)
            }
            return b
        }
        )
        res.render('contens/page_manager/Post', { groups: group.toJSON(), Posts: transformer_post, isAdmin: true })

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error })
    }

})
route.get('/admin/Post', async (req: Request, res: Response): Promise<void> => {
    try {

        const isAdmin = req.session?.admin;

        //const idGroup:number = req.session.currentGroupId;
        const idGroup = 1;
        let group: Group = await model_group.select(idGroup);
        let contain_posts: contain_posts[] = await Posts.findAll({
            where: { group_id: idGroup, scope: 'group' },
            include: [{
                model: User,
                as: 'users',
                required: true,
                right: true
            }]
        });


        const transformer_post: contain_posts[] = contain_posts.map((b: contain_posts) => {
            b = b.toJSON() as contain_posts;
            let contenObj: contentOfPost | string = b.contens;
            while (typeof contenObj === 'string') {
                contenObj = JSON.parse(contenObj);
            }

            b.contens = {
                text: contenObj.text,
                image: JSON.stringify(contenObj.image)
            }
            return b;
        })
        res.render('contens/page_manager/Post', { groups: group.toJSON(), Posts: transformer_post, isAdmin: true })

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error })
    }
})
route.delete('/del', authenticate.user_auth, async (req: Request, res: Response): Promise<void> => {
    const id = req.body;
    await model_Posts.des(id);
    const idUser: string | undefined = req.admin?.id;
    const isAdmin: string | undefined = req.session?.admin;
    //const idGroup = req.session.currentGroupId;
    const idGroup = 1;
    let group: Group = await model_group.select(idGroup);
    let contain_posts: contain_posts[] = await Posts.findAll({
        where: { group_id: idGroup, scope: 'group' },
        include: [{
            model: User,
            as: 'users',
            required: true,
            right: true
        }]
    });


    const transformer_post: contain_posts[] = contain_posts.map((b: contain_posts) => {
        b = b.toJSON() as contain_posts;
        let contenObj: contentOfPost | string = b.contens;
        while (typeof contenObj === 'string') {
            contenObj = JSON.parse(contenObj);
        }

        b.contens = {
            text: contenObj.text,
            image: JSON.stringify(contenObj.image)
        }
        return b;
    })
    res.render('contens/page_manager/Post', { groups: group.toJSON(), Posts: transformer_post, isAdmin: true })
})
route.post('/update', async (req: Request, res: Response): Promise<void> => {
    //check req.body
    const { id } = req.body;
    const isAdmin: string | undefined = req.session?.admin;
    let post: contain_posts | null = await Posts.findOne({
        where: { id: id },
        include: [
            {
                model: User,
                as: 'users',
                required: true

            },
            {
                model: Group,
                as: 'groups',
                required: false
            }
        ]
    });
    post = post!.toJSON() as contain_posts;
    let contenObj: contentOfPost | string = post.contens;
    while (typeof contenObj === 'string') {
        contenObj = JSON.parse(contenObj);
    }

    post.contens = {
        text: contenObj.text,
        image: JSON.stringify(contenObj.image)
    }

    res.render('contens/Post/Post', { Post: post, isAdmin: true })
})

route.get('/sort', authenticate.user_auth, async (req: Request, res: Response): Promise<void> => {
    const id = req.admin?.id;
    //const idGroup:number = req.session.currentGroupId;
    const idGroup = 1;
    try {
        //for where in the query
        let sort: string = req.query.sort as string;
        let post: contain_posts[] = await Posts.findAll({
            attributes: {
                include: [
                    [
                        sequelize.literal(`(
                SELECT COUNT(*)
                FROM interactions AS i
                WHERE i.id_Posts = Posts.id
                  AND i.classify LIKE '${sort}'
            )`),
                        'interactionCount'
                    ]
                ]
            },
            where: { user_id: id, group_id: idGroup, scope: 'group' },
            include: [
                {
                    model: User,
                    as: 'users',
                    required: false
                }
            ],
            order: [[sequelize.literal('interactionCount'), 'DESC']]
        })
        const group = await Group.findOne({ where: { id: idGroup } });
        // Chuyển từng instance Sequelize thành object thuần và xử lý contens
        const tranAllPosts = post.map((Post: contain_posts) => {
            const obj = Post.toJSON ? Post.toJSON() : Post;

            try {
                let parsed = JSON.parse(obj.contens || '{}');
                if (typeof parsed === 'string') {
                    parsed = JSON.parse(parsed);
                }

                let imageValue = parsed.image || null;

                if (imageValue && typeof imageValue === "object") {
                    // Nếu là object → stringify
                    imageValue = JSON.stringify(imageValue);
                }

                // Nếu đã là string thì giữ nguyên
                obj.contens = {
                    text: parsed.text || '',
                    image: imageValue
                };
            } catch {
                obj.contens = { text: '', image: 'null' };
            }

            return obj;
        });
        return res.render('contens/page_manager/Post', {
            Posts: tranAllPosts,
            group: group?.toJSON()
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }

})

route.get('/admin/Post/sort', async (req: Request, res: Response): Promise<void> => {
    //const idGroup:number = req.session.currentGroupId;
    const idGroup = 1;
    const isAdmin: string | undefined = req.session?.admin;
    try {
        //for where in the query
        let sort: string = req.query.sort as string;
        let post: contain_posts[] = await Posts.findAll({
            attributes: {
                include: [
                    [
                        sequelize.literal(`(
                SELECT COUNT(*)
                FROM interactions AS i
                WHERE i.id_Posts = Posts.id
                  AND i.classify LIKE '${sort}'
            )`),
                        'interactionCount'
                    ]
                ]
            },
            where: { group_id: idGroup, scope: 'group' },
            include: [
                {
                    model: User,
                    as: 'users',
                    required: false
                }
            ],
            order: [[sequelize.literal('interactionCount'), 'DESC']]
        })
        const group = await Group.findOne({ where: { id: idGroup } });
        // Chuyển từng instance Sequelize thành object thuần và xử lý contens
        const tranAllPosts = post.map((Post: contain_posts) => {
            const obj = Post.toJSON ? Post.toJSON() : Post;

            try {
                let parsed = JSON.parse(obj.contens || '{}');
                if (typeof parsed === 'string') {
                    parsed = JSON.parse(parsed);
                }

                let imageValue = parsed.image || null;

                if (imageValue && typeof imageValue === "object") {
                    // Nếu là object → stringify
                    imageValue = JSON.stringify(imageValue);
                }

                // Nếu đã là string thì giữ nguyên
                obj.contens = {
                    text: parsed.text || '',
                    image: imageValue
                };
            } catch {
                obj.contens = { text: '', image: 'null' };
            }

            return obj;
        });
        return res.render('contens/page_manager/Post', {
            Posts: tranAllPosts,
            group: group?.toJSON(),
            isAdmin: true
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }

})
export { route };
