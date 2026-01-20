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

router.delete('/waited', async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            id_userA,
            id_userB,
            notification_value
        } = req.body as {
            id_userA: string;
            id_userB: string;
            notification_value: NotificationServerTake;
        };

        if (!id_userA || !id_userB || notification_value === undefined) {
            res.status(400).json({
                error: true,
                message: 'Missing required inputs'
            });
            return;
        }

        await FriendController.deleteFriend(
            id_userA,
            id_userB,
            notification_value
        );

        res.status(200).json({
            success: true,
            message: 'Friend deleted successfully'
        });
    } catch (error) {
        console.error('Error in DELETE /friends route:', error);

        if (error instanceof Error) {
            if (error.message === 'FRIENDSHIP_NOT_FOUND') {
                res.status(404).json({
                    error: true,
                    message: 'Friendship not found'
                });
                return;
            }
        }

        res.status(500).json({
            error: true,
            message: 'Internal server error'
        });
    }
});

router.post('/friends', async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            id_userA,
            id_userB,
            notification_value
        } = req.body as {
            id_userA: string;
            id_userB: string;
            notification_value: NotificationServerTake;
        };

        // Validation
        if (!id_userA || !id_userB || notification_value === undefined) {
            res.status(400).json({
                error: true,
                message: 'Missing required inputs'
            });
            return;
        }

        // Không cho phép kết bạn với chính mình
        if (id_userA === id_userB) {
            res.status(400).json({
                error: true,
                message: 'You cannot send friend request to yourself'
            });
            return;
        }

        await FriendController.sendFriendRequest(
            id_userA,
            id_userB,
            notification_value
        );

        res.status(200).json({
            success: true,
            message: 'Friend request sent successfully'
        });
    } catch (error) {
        console.error('Error in POST /friends route:', error);

        if (error instanceof Error) {
            if (error.message === 'FRIENDSHIP_EXISTS') {
                res.status(400).json({
                    error: true,
                    message: 'Friendship already exists'
                });
                return;
            }
        }

        res.status(500).json({
            error: true,
            message: 'Internal server error'
        });
    }
});

router.put('/friends/accept', async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            id_userA,
            id_userB,
            notification_value
        } = req.body as {
            id_userA: string;
            id_userB: string;
            notification_value: NotificationServerTake;
        };

        if (!id_userA || !id_userB || notification_value === undefined) {
            res.status(400).json({
                error: true,
                message: 'Missing required inputs'
            });
            return;
        }

        await FriendController.acceptFriendRequest(
            id_userA,
            id_userB,
            notification_value
        );

        res.status(200).json({
            success: true,
            message: 'Friend request accepted successfully'
        });
    } catch (error) {
        console.error('Error in PUT /friends/accept route:', error);

        if (error instanceof Error) {
            if (error.message === 'FRIEND_REQUEST_NOT_FOUND') {
                res.status(404).json({
                    error: true,
                    message: 'Friend request not found'
                });
                return;
            }
        }

        res.status(500).json({
            error: true,
            message: 'Internal server error'
        });
    }
});

router.post('/friends/check', async (req: Request, res: Response): Promise<void> => {
    try {
        const { id_userA, id_userB } = req.body;

        if (!id_userA || !id_userB) {
            res.status(400).json({
                error: true,
                message: 'Missing required inputs'
            });
            return;
        }

        const result = await FriendController.checkFriendship(
            id_userA,
            id_userB
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error in POST /friends/check route:', error);
        res.status(500).json({
            error: true,
            message: 'Internal server error'
        });
    }
});



export { router }