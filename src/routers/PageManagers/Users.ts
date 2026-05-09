import express, { Response } from 'express'
import { authenticate } from '../../Middlewares/Auth'
import { upload } from '../../Middlewares/UpdateImage';
import throwError from '../../Helpers/ThrowErrorOfRouter';
import handleUpload from '../../Middlewares/HandleUpload'
import { PageManagerUserController } from '../../Constrollers/PageManagers/PageManagerUserController';
import { UserController } from '../../Constrollers/UserController';

import ExtendRequest from '../../Types/ExtendRequest';

// ============================================================
// PAGE MANAGER USER ROUTES
// Responsibility: Define endpoints, attach middleware, call controller
// ============================================================

const router = express.Router();

router.get('/sort', authenticate.user_auth, async (req: ExtendRequest, res: Response): Promise<any> => {
    try {
        const id = req.admin?.id;
        const selectedTargetId: string = req.query.selectedTargetId as string;
        let sort: string = req.query.sort as string;
        const tranAllPosts = await PageManagerUserController.selectPostWithSort(selectedTargetId, sort);
        const user = await UserController.selectUser(selectedTargetId);
        const config_interface = String(id) === String(selectedTargetId);
        return res.render('Contents/PageManagers/User', {
            Posts: tranAllPosts,
            user: user?.toJSON(),
            config_interface
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
});

router.post('/', authenticate.user_auth, async (req: ExtendRequest, res: Response): Promise<void> => {
    const id = req.admin?.id;
    const { selectedTargetId } = req.body || {};

    try {
        if (!id) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const user = await UserController.selectUser(selectedTargetId);
        const tranAllPosts = await PageManagerUserController.selectPosts(selectedTargetId);

        const config_interface = String(id) === String(selectedTargetId);
        return res.render('Contents/PageManagers/User', {
            Posts: tranAllPosts,
            user: user?.toJSON(),
            config_interface
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/update', authenticate.user_auth, async (req: ExtendRequest, res: Response): Promise<void> => {
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

        const result = await PageManagerUserController.updateUser(id, name);

        if (result !== 0) {
            res.status(200).json({ message: 'Updated successfully' });
        } else {
            res.status(500).json({ message: 'Update error' });
        }
    } catch (err) {
        throwError(err, res);
    }
});

router.post('/upload/avatar', upload.single('image'), handleUpload, authenticate.user_auth, async (req: ExtendRequest, res: Response): Promise<void> => {
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
        const result = await PageManagerUserController.updateAvatarUser(id, imagePath);
        if (result !== 0) {
            res.redirect('/main');
        } else {
            res.status(500).json({ message: 'Update error' });
        }
    } catch (err) {
        throwError(err, res);
    }
});

router.post('/upload/thumbnail', upload.single('image'), handleUpload, authenticate.user_auth, async (req: ExtendRequest, res: Response): Promise<void> => {
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
        const result = await PageManagerUserController.updateThumbnailUser(id, imagePath);
        if (result !== 0) {
            res.redirect('/main');
        } else {
            res.status(500).json({ message: 'Update error' });
        }
    } catch (err) {
        throwError(err, res);
    }
});

router.post('/upload/informationuser', authenticate.user_auth, async (req: ExtendRequest, res: Response): Promise<void> => {
    try {
        const id = req.admin?.id;
        if (!id) {
            res.status(401).json({ message: 'Not allowed' });
            return;
        }
        const { name, hastag, hometown, school } = req.body as { name: string, hastag: string, hometown: string, school: string };
        const result = await PageManagerUserController.updateInformationsUser(id, name, hastag, hometown, school);
        if (result !== 0) {
            res.redirect('/main');
        } else {
            res.status(500).json({ message: 'Update error' });
        }
    } catch (err) {
        throwError(err, res);
    }
});

export default router;
