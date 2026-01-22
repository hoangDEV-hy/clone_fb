import express, { Request, Response } from 'express'
import { authenticate } from '../../middware/auth'
import { methods as page_managerController } from '../../constrollers/page_manager/user';
import { User } from '../../models/user';
import { upload } from '../../middware/updateImage';
import { Group } from '../../models/group';
import { Posts } from '../../models/Posts';
import { sequelize } from '../../configs/sql';
import throwError from '../../helpers/ThrowErrorOfRouter';

import ExtendRequest from '../../types/Type_ExtendRequest';

let route = express.Router();
//for sorting
route.get('/sort', authenticate.user_auth, async (req: ExtendRequest, res: Response): Promise<any> => {
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


route.post('/', authenticate.user_auth, async (req: ExtendRequest, res: Response): Promise<void> => {
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



route.post(
    '/update',
    authenticate.user_auth,
    async (req: ExtendRequest, res: Response): Promise<void> => {
        try {
            const { name } = req.body;
            const id = req.admin?.id;

            if (!id) {
                res.status(401).json({ message: 'Not allowed' });
                return;
            }

            if (!name) {
                res.status(400).json({ message: 'Name is required' });
                return;
            }

            const result = await page_managerController.updateUser(id, name);

            if (result !== 0) {
                res.status(200).json({ message: 'Updated successfully' });
            } else {
                res.status(500).json({ message: 'Update error' });
            }
        } catch (err) {
            throwError(err, res);
        }
    }
);
route.post('/upload/avatar', upload.single('image'), page_managerController.handleUpload, authenticate.user_auth, async (req: ExtendRequest, res: Response): Promise<void> => {
    try {
        const id = req.admin?.id;
        const imagePath = `/pictures/${req.file?.filename}`;
        if (!id) {
            res.status(401).json({ message: 'Not allowed' });
            return;
        }

        if (!imagePath) {
            res.status(400).json({ message: 'imagePath is required' });
            return;
        }
        const result = await page_managerController.updateAvatarUser(id, imagePath);
        if (result !== 0) {
            res.redirect('/main');
        } else {
            res.status(500).json({ message: 'Update error' });
        }
    } catch (err) {
        throwError(err, res);
    }
});
route.post('/upload/thumbnail', upload.single('image'), page_managerController.handleUpload, authenticate.user_auth, async (req: ExtendRequest, res: Response): Promise<void> => {
    try {
        const id = req.admin?.id;
        const imagePath = `/pictures/${req.file?.filename}`;
        if (!id) {
            res.status(401).json({ message: 'Not allowed' });
            return;
        }

        if (!imagePath) {
            res.status(400).json({ message: 'imagePath is required' });
            return;
        }
        const result = await page_managerController.updateThumbnailUser(id, imagePath);
        if (result !== 0) {
            res.redirect('/main');
        } else {
            res.status(500).json({ message: 'Update error' });
        }
    } catch (err) {
        throwError(err, res);
    }
});



route.post('/upload/informationuser', authenticate.user_auth, async (req: ExtendRequest, res: Response): Promise<void> => {
    try {
        const id = req.admin?.id;
        if (!id) {
            res.status(401).json({ message: 'Not allowed' });
            return;
        }
        const { name, hastag, hometown, school  } = req.body as { name: string, hastag: string, hometown: string, school:string };
        const result = await page_managerController.updateInformationsUser(id, name, hastag, hometown, school);
        if (result !== 0) {
            res.redirect('/main');
        } else {
            res.status(500).json({ message: 'Update error' });
        }
    } catch (err) {
        throwError(err, res);
    }
})


export { route }