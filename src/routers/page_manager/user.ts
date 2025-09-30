import express, { Request, Response } from 'express'
import { authenticate } from '../../middware/auth'
import { method } from '../../constrollers/page_manager/user';
import { User } from '../../models/user';
import { upload } from '../../middware/updateImage';
import { Group } from '../../models/group';
import { Posts } from '../../models/Posts';
import { sequelize } from '../../configs/sql';

let route = express.Router();
//for sorting
declare module "express-serve-static-core" {
    interface Request {
        admin?: {
            id: string
        };
    }
}
route.get('/sort', authenticate.user_auth, async (req: Request, res: Response): Promise<any> => {
    const id = req.admin?.id;
    try {
        console.log("sort=:", req.query.sort);
        //for where in the query
        let sort: string = req.query.sort as string;
        let post: any = await Posts.findAll({
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
            where: { user_id: id },
            include: [
                {
                    model: Group,
                    as: 'groups',
                    required: false
                },
                {
                    model: User,
                    as: 'users',
                    required: false
                }
            ],
            order: [[sequelize.literal('interactionCount'), 'DESC']]
        })
        const user = await User.findOne({ where: { id } });
        // Chuyển từng instance Sequelize thành object thuần và xử lý contens
        const tranAllPosts = post.map((Post: any) => {
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
        return res.render('contens/page_manager/user', {
            Posts: tranAllPosts,
            user: user?.toJSON()
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }

})
route.get('/', authenticate.user_auth, async (req: any, res: any) => {
    const id = req.admin?.id;
    try {
        const user = await User.findOne({ where: { id } });

        const post = await Posts.findAll({
            where: { user_id: id },
            include: [
                { model: Group, as: 'groups', required: false },
                { model: User, as: 'users', required: false }
            ]
        });




        // Chuyển từng instance Sequelize thành object thuần và xử lý contens
        const tranAllPosts = post.map((Post: any) => {
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
        return res.render('contens/page_manager/user', {
            Posts: tranAllPosts,
            user: user?.toJSON()
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
});


route.post('/update', authenticate.user_auth, method.updateUser);
route.post('/upload/avatar', upload.single('image'), method.handleUpload, authenticate.user_auth, method.updateAvatarUser);
route.post('/upload/thumbnail', upload.single('image'), method.handleUpload, authenticate.user_auth, method.updateThumbnailUser);


export { route }