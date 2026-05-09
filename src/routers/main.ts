import express, { Router, Request, Response } from 'express';
import { authenticate } from '../Middlewares/Auth';
import { FeedController } from '../Constrollers/FeedController';

// ============================================================
// FEED ROUTES
// Responsibility: Define endpoints, attach middleware, call controller
// ============================================================

const router: Router = express.Router();

router.get('/', authenticate.user_auth, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).admin?.id;

        if (!userId) {
            res.status(401).json({
                success: false,
                error: 'Unauthorized - Please login'
            });
            return;
        }

        let limit: number;
        try {
            limit = FeedController.validateLimit(req.query.limit);
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: "Failed to validate limit"
            });
            return;
        }

        const cursor = req.query.cursor as string;

        const user = await FeedController.getUser(userId);
        if (!user) {
            res.status(400).json({ success: false });
            return;
        }

        const feedResult = await FeedController.getFeed({
            userId: user.id,
            limit,
            cursor
        });

        const friendList = await FeedController.getFriendList(userId);

        res.render('Contents/Main', {
            allPosts: feedResult.posts,
            user: user.toJSON(),
            friend_array: friendList,
            cursor: feedResult.nextCursor
        });

    } catch (error: any) {
        console.error('Feed router error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch feed'
        });
    }
});

router.get('/json', authenticate.user_auth, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).admin?.id;

        if (!userId) {
            res.status(401).json({
                success: false,
                error: 'Unauthorized'
            });
            return;
        }

        let limit: number;
        try {
            limit = FeedController.validateLimit(req.query.limit);
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message
            });
            return;
        }

        const cursor = req.query.cursor as string;

        const feedResult = await FeedController.getFeed({
            userId,
            limit,
            cursor
        });

        res.json({
            success: true,
            data: feedResult
        });

    } catch (error: any) {
        console.error('Feed JSON router error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch feed'
        });
    }
});

router.post('/clear-cache', authenticate.user_auth, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).admin?.id;

        if (!userId) {
            res.status(401).json({
                success: false,
                error: 'Unauthorized'
            });
            return;
        }

        await FeedController.clearCache(userId);

        res.json({
            success: true,
            message: 'Cache cleared successfully'
        });

    } catch (error: any) {
        console.error('Clear cache router error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to clear cache'
        });
    }
});

export default router;
