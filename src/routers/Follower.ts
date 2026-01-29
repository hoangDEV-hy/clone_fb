import express, { Request, Response } from "express";
import FollowerController from '../Constrollers/Followers';

import NotificationServerTake from "../Types/Notification";

let router = express.Router();

router.get('/followers', async (req: Request, res: Response): Promise<void> => {
    try {
        const { selectedFollowerID, page = '1' } = req.query;

        const data = await FollowerController.selectDanhSach(
            selectedFollowerID as string,
            Number(page)
        );

        res.status(200).json({
            success: true,
            pagination: page,
            data: data
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.post(
    '/followers',
    async (req: Request, res: Response): Promise<void> => {
        try {
            const {
                selectedFollowerID,
                additionedFollowingsID,
                notification_value,
            } = req.body as {
                selectedFollowerID: string;
                additionedFollowingsID: string[];
                notification_value: NotificationServerTake;
            };

            // Missing input
            if (
                !selectedFollowerID ||
                !additionedFollowingsID ||
                notification_value === undefined
            ) {
                throw new Error('MISSING_INPUT');
            }

            // Self follow is not allowed
            if (additionedFollowingsID.includes(selectedFollowerID)) {
                throw new Error('SELF_FOLLOW_NOT_ALLOWED');
            }

            const data = await FollowerController.addFollowers(
                additionedFollowingsID,
                selectedFollowerID,
                notification_value
            );

            res.status(200).json({ succes: true, data });
        } catch (error) {
            console.error('Error in addFollowers route:', error);

            if (error instanceof Error) {
                if (error.message === 'MISSING_INPUT') {
                    res.status(400).json({
                        error: true,
                        message: 'Missing required inputs',
                    });
                }

                if (error.message === 'SELF_FOLLOW_NOT_ALLOWED') {
                    res.status(400).json({
                        error: true,
                        message: 'You cannot follow yourself',
                    });
                }
            }

            res.status(500).json({
                error: true,
                message: 'Internal server error',
            });
        }
    }
);

router.delete('/followers', async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            selectedFollowerID,
            deletedFollowingsID,
            notification_value,
        } = req.body as {
            selectedFollowerID: string;
            deletedFollowingsID: string[];
            notification_value: NotificationServerTake;
        };

        if (
            !selectedFollowerID ||
            !deletedFollowingsID ||
            notification_value === undefined
        ) {
            res.status(400).json({
                error: true,
                message: 'Thiếu inputs'
            });
        }

        const data = await FollowerController.deleteFollowers(
            deletedFollowingsID,
            selectedFollowerID,
            notification_value
        );
        res.status(200).json({
            success: true,
            message: 'Huỷ theo dõi thành công',
            data: data
        });
    } catch (error) {
        console.error('Error in deleteFollowers route:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/existingfollowing', async (req: Request, res: Response): Promise<void> => {
    try {
        const { follower, following } = req.body;

        if (!follower || !following) {
            res.status(400).json({
                message: 'follower và following là bắt buộc',
            });
        }

        const exists = await FollowerController.checkFollowing(follower, following);

        res.status(200).json({
            message: exists ? 'Đã tồn tại follow' : 'Chưa từng follow',
            exists,
        });
    } catch (error) {
        console.error('existingfollowing error:', error);

        res.status(500).json({
            message: 'Lỗi server',
        });
    }
});

export { router };
