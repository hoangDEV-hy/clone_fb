import express, { Request, Response } from 'express'
import { authenticate } from '../../middlewares/Mid_Auth'
import { method } from '../../controllers/page_manager/Ctrl_User';
import { User } from '../../models/Model_User';
import { upload } from '../../middlewares/Mid_UpdateImage';
import { Group } from '../../models/Model_Group';
import { Posts } from '../../models/Model_Post';
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
    const selectedTargetId: string = req.query.selectedTargetId as string;
    //for where in the query
    let sort: string = req.query.sort as string;
    try {
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
            where: { user_id: selectedTargetId },
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
        const user = await User.findOne({ where: { id: selectedTargetId } });
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
        const config_interface = String(id) === String(selectedTargetId);
        return res.render('contens/page_manager/user', {
            Posts: tranAllPosts,
            user: user?.toJSON(),
            config_interface
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }

})


route.post('/', authenticate.user_auth, async (req: Request, res: Response): Promise<void> => {
    const id = req.admin?.id;
    const { selectedTargetId } = req.body || {};

    try {
        if (!id) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const user = await User.findOne({
            where: { id: selectedTargetId }
        });

        const posts = await Posts.findAll({
            where: { user_id: selectedTargetId },
            include: [
                { model: Group, as: 'groups', required: false },
                { model: User, as: 'users', required: false }
            ]
        });

        const tranAllPosts = posts.map((postItem: any) => {
            const obj = postItem.toJSON ? postItem.toJSON() : postItem;

            try {
                let parsed: any = JSON.parse(obj.contens || '{}');

                if (typeof parsed === 'string') {
                    parsed = JSON.parse(parsed);
                }

                let imageValue = parsed.image ?? null;

                if (imageValue && typeof imageValue === 'object') {
                    imageValue = JSON.stringify(imageValue);
                }

                obj.contens = {
                    text: parsed.text || '',
                    image: imageValue
                };
            } catch (err) {
                obj.contens = {
                    text: '',
                    image: null
                };
            }

            return obj;
        });

        const config_interface = String(id) === String(selectedTargetId);

        return res.render('contens/page_manager/user', {
            Posts: tranAllPosts,
            user: user?.toJSON(),
            config_interface
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
        return;
    }
});



route.post('/update', authenticate.user_auth, method.updateUser);
route.post('/upload/avatar', upload.single('image'), method.handleUpload, authenticate.user_auth, method.updateAvatarUser);
route.post('/upload/thumbnail', upload.single('image'), method.handleUpload, authenticate.user_auth, method.updateThumbnailUser);


export { route }