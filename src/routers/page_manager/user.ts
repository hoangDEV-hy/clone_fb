import express from 'express'
import { authenticate } from '../../middware/auth'
import { method } from '../../constrollers/page_manager/user';
import { User } from '../../models/user';
import { upload } from '../../middware/updateImage';
let route = express.Router();

route.get('/', authenticate, async (req: any, res: any) => {
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

route.post('/update', authenticate, method.updateUser);
route.post('/upload', upload.single('image'), method.handleUpload);

export { route }