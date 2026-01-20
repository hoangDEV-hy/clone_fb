import express, { Response } from "express";
import { authenticate } from '../../middware/auth';
import { methods as friendController } from '../../constrollers/user/user_user'

import ExtendRequest from "../../types/Type_ExtendRequest";
import throwError from "../../helpers/ThrowErrorOfRouter";


let router = express.Router();

router.get('/joined', authenticate.user_auth, async (req: ExtendRequest, res: Response): Promise<void> => {
    try {
        const id = req.admin?.id;
        if (!id) {
            res.status(403).send('Không có quyền');
            return;
        }
        const plainFriend = await friendController.selectFriendsDone(id);
        res.render('contens/page_manager/friend', { group: plainFriend });
    } catch (error) {
        throwError(error, res);
    }
});

router.get('/waited', authenticate.user_auth, async (req: ExtendRequest, res: Response) => {
    try {
        const id = req.admin?.id;
        if (!id) {
            res.status(403).send('Không có quyền');
            return;
        }
        const plainFriend = await friendController.selectFriendsRequest(id);
        res.render('contens/page_manager/friend', { group: plainFriend });
    } catch (error) {
        throwError(error, res);
    }
});

router.delete(
    '/joined',
    authenticate.user_auth,
    async (req: ExtendRequest, res: Response): Promise<void> => {
        try {
            const id = req.admin?.id;
            const { id_userB } = req.body as { id_userB: string };

            if (!id) {
                res.status(403).send('Không có quyền');
                return;
            }

            const result = await friendController.delFriend(id, id_userB);

            if (!result) {
                console.log('result', result);
                res.status(500).json({ error: 'error server' }); // Đổi thành json
                return;
            }

            // Trả về success response thay vì redirect
            res.status(200).json({
                success: true,
                message: 'Xoá bạn bè thành công'
            });
            return;
        } catch (err) {
            throwError(err, res);
        }
    }
);

router.delete(
    '/waited',
    authenticate.user_auth,
    async (req: ExtendRequest, res: Response): Promise<void> => {
        try {
            const id = req.admin?.id;
            const { id_userB } = req.body as { id_userB: string };

            if (!id) {
                res.status(403).send('Không có quyền');
                return;
            }

            const result = await friendController.delRequestFriend(id, id_userB);

            if (!result) {
                console.log('result', result);
                res.status(500).json({ error: 'error server' }); // Đổi thành json
                return;
            }

            // Trả về success response thay vì redirect
            res.status(200).json({
                success: true,
                message: 'Xoá yêu cầu kết bạn thành công'
            });
            return;
        } catch (err) {
            throwError(err, res);
        }
    }
);



export { router }