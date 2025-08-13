import express from 'express'
import { authenticate } from '../../middware/auth'
import { method } from '../../constrollers/page_manager/user';
import { User } from '../../models/user';
import { upload } from '../../middware/updateImage';
let route = express.Router();

route.get('/', authenticate.user_auth, async (req: any, res: any) => {
    const id = req.admin?.id;
    try {
        const user = await User.findOne({ where: { id } });

        if (!user) {
            return res.status(401).json({ message: 'Invalid user ID' });
        }

        // Truyền dữ liệu user vào view
        res.render('contens/page_manager/user', { user: user.toJSON() });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

route.post('/update', authenticate.user_auth, method.updateUser);
route.post('/upload/avatar', upload.single('image'), method.handleUpload, authenticate.user_auth, method.updateAvatarUser);
route.post('/upload/thumbnail', upload.single('image'), method.handleUpload, authenticate.user_auth, method.updateThumbnailUser);


export { route }