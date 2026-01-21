import express, { Request, Response } from "express";
import { authenticate } from '../../middware/auth';
import { methods as friendController } from '../../constrollers/user/user_user'

import ExtendRequest from "../../types/Type_ExtendRequest";
import throwError from "../../helpers/ThrowErrorOfRouter";
import NotificationServerTake from "../../types/Type_Notification";


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
        // Thêm isPending vào mỗi friend object
        const friendsWithPending = plainFriend.map(friend => ({
            ...friend,
            isPending: true
        }));

        res.render('contens/page_manager/friend', { group: friendsWithPending });
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
    '/waited', authenticate.user_auth,
    async (req: ExtendRequest, res: Response): Promise<void> => {
        try {
            const {
                id_userB,
                notification_value,
            } = req.body as {
                id_userB: string;
                notification_value: NotificationServerTake;
            };
            const id_userA = req.admin?.id;
            if (!id_userA) {
                res.status(403).send('Không có quyền');
                return;
            }

            if (!id_userA || !id_userB || notification_value === undefined) {
                res.status(400).json({
                    error: true,
                    message: 'Missing required inputs',
                });
                return;
            }

            notification_value.selectedSenderId = id_userA;
            notification_value.content = `${id_userA} ${notification_value.content}`;

            await friendController.deleteFriendRequest(
                id_userA,
                id_userB,
                notification_value
            );

            res.status(200).json({
                success: true,
                message: 'Friend deleted successfully',
            });
        } catch (error: unknown) {
            console.error('Error in DELETE /friends route:', error);

            if (error instanceof Error) {
                if (error.message === 'FRIENDSHIP_NOT_FOUND') {
                    res.status(404).json({
                        error: true,
                        message: 'Friendship not found',
                    });
                    return;
                }
            }

            res.status(500).json({
                error: true,
                message: 'Internal server error',
            });
        }
    }
);

router.post('/', authenticate.user_auth, async (req: ExtendRequest, res: Response): Promise<void> => {
    try {
        let {
            id_userB,
            notification_value
        } = req.body as {
            id_userB: string;
            notification_value: NotificationServerTake;
        };
        const id_userA = req.admin?.id;
        if (!id_userA) {
            res.status(403).send('Không có quyền');
            return;
        }

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
        notification_value.selectedSenderId = id_userA;
        notification_value.content = `${id_userA} ${notification_value.content}`;
        await friendController.sendFriendRequest(
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

router.put('/accept', authenticate.user_auth, async (req: ExtendRequest, res: Response): Promise<void> => {
    try {
        const {
            id_userB,
            notification_value
        } = req.body as {
            id_userB: string;
            notification_value: NotificationServerTake;
        };
        const id_userA = req.admin?.id;
        if (!id_userA) {
            res.status(403).send('Không có quyền');
            return;
        }
        if (!id_userA || !id_userB || notification_value === undefined) {
            res.status(400).json({
                error: true,
                message: 'Missing required inputs'
            });
            return;
        }
        notification_value.selectedSenderId = id_userA;
        notification_value.content = `${id_userA} ${notification_value.content}`;

        await friendController.acceptFriendRequest(
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

router.post('/check', authenticate.user_auth, async (req: ExtendRequest, res: Response): Promise<void> => {
    try {
        const { id_userB } = req.body;

        const id_userA = req.admin?.id;
        if (!id_userA) {
            res.status(403).send('Không có quyền');
            return;
        }
        if (!id_userA || !id_userB) {
            res.status(400).json({
                error: true,
                message: 'Missing required inputs'
            });
            return;
        }

        let result = await friendController.checkFriendship(
            id_userA,
            id_userB
        );
        let data = null;
        if (result.status === 'done') data = { isFriend: true }
        else if (result.status === 'pending') data = { isPending: true }

        res.status(200).json({
            success: true,
            data: data
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