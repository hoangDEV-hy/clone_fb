import express, { Router, Request, Response } from 'express';
import { authenticate } from '../middware/auth';
import { FeedController } from '../constrollers/Ctrl_Feed';

const router: Router = express.Router();
const feedController = new FeedController();

/**
 * @route   GET /feed
 * @desc    Get user feed with view rendering
 * @access  Private
 */

//cursor: respone đầu trả về nextcursor, đưa nextcursor vào req thứ 2 thì sẽ lấy dc các bản ghi phía sau bản ghi cuối cùng
router.get('/', authenticate.user_auth, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).admin?.id;

        // Check authentication
        if (!userId) {
            res.status(401).json({
                success: false,
                error: 'Unauthorized - Please login'
            });
            return;
        }

        // Validate and parse parameters
        let limit: number;
        try {
            limit = feedController.validateLimit(req.query.limit);
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message
            });
            return;
        }

        const cursor = req.query.cursor as string;

        // Get user data
        const user = await feedController.getUser(userId);
        if (!user) {
            res.status(400).json({
                success: false
            });
            return;
        }
        // Get feed posts
        const feedResult = await feedController.getFeed({
            userId: user.id,
            limit,
            cursor
        });

        // Get friend list
        const friendList = await feedController.getFriendList(userId);

        // Render view
        res.render('contens/main', {
            allPosts: feedResult.posts,
            user: user.toJSON(),
            friend_array: friendList,
            cursor: feedResult.nextCursor
        });

    } catch (error: any) {
        console.error('Feed route error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch feed'
        });
    }
});

/**
 * @route   GET /feed/json
 * @desc    Get user feed as JSON (for AJAX/API requests)
 * @access  Private
 */
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

        // Validate limit
        let limit: number;
        try {
            limit = feedController.validateLimit(req.query.limit);
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message
            });
            return;
        }

        const cursor = req.query.cursor as string;

        // Get feed
        const feedResult = await feedController.getFeed({
            userId,
            limit,
            cursor
        });

        // Return JSON
        res.json({
            success: true,
            data: feedResult
        });

    } catch (error: any) {
        console.error('Feed JSON route error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch feed'
        });
    }
});

/**
 * @route   POST /feed/clear-cache
 * @desc    Clear user feed cache for reload
 * @access  Private
 */

//cache-luu lai 10 bai, khi reload lai không cần truy vấn nữa
//clear all cache cua admin( pattern co userId)
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

        // Clear cache
        await feedController.clearCache(userId);

        res.json({
            success: true,
            message: 'Cache cleared successfully'
        });

    } catch (error: any) {
        console.error('Clear cache route error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to clear cache'
        });
    }
});

export { router as route };