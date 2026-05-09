import { Router, Response } from 'express';
import { MutualFriendsController } from '../Constrollers/MutualFriendsController';
import { authenticate } from '../Middlewares/Auth';
import ExtendRequest from '../Types/ExtendRequest';

// ============================================================
// MUTUAL FRIEND ROUTES
// Responsibility: Define endpoints, attach middleware, call controller
// ============================================================

const router = Router();

router.get(
    '/',
    authenticate.user_auth,
    async (req: ExtendRequest, res: Response): Promise<void> => {
        try {
            const userId = req.admin?.id;

            if (!userId) {
                throw new Error('Unauthorized. User not authenticated.');
            }

            const limit = MutualFriendsController.validateLimit(req.query.limit);
            const type = MutualFriendsController.validateType(req.query.type);
            const cursor = req.query.cursor as string | undefined;
            const targetUserId = "";

            const result = await MutualFriendsController.getAllSuggestions({
                userId,
                targetUserId,
                cursor,
                limit,
                type,
            });

            res.status(200).json({
                success: true,
                data: result,
                message: 'Suggested friends retrieved successfully.',
            });
        } catch (error) {
            console.error('Error in getSuggestedFriends route:', error);

            if (error instanceof Error) {
                if (error.message === 'Unauthorized. User not authenticated.') {
                    res.status(401).json({
                        success: false,
                        message: 'Unauthorized. User not authenticated.',
                    });
                    return;
                }

                if (
                    error.message.includes('Target user ID is required') ||
                    error.message.includes('Invalid type') ||
                    error.message.includes('Limit must be')
                ) {
                    res.status(400).json({
                        success: false,
                        message: "Unauthorized. User not authenticated.",
                    });
                    return;
                }

                if (error.message.includes('not found')) {
                    res.status(404).json({
                        success: false,
                        message: "Target user ID is required and must be a valid string",
                    });
                    return;
                }
            }

            res.status(500).json({
                success: false,
                message: 'An error occurred while retrieving suggested friends.',
            });
        }
    }
);

router.get(
    '/friends',
    authenticate.user_auth,
    async (req: ExtendRequest, res: Response): Promise<void> => {
        try {
            const userId = req.admin?.id;

            if (!userId) {
                throw new Error('Unauthorized. User not authenticated.');
            }

            const targetUserId = MutualFriendsController.validateTargetUserId(req.query.targetUserId);
            const limit = MutualFriendsController.validateLimit(req.query.limit);
            const type = MutualFriendsController.validateType(req.query.type);
            const cursor = req.query.cursor as string | undefined;

            const result = await MutualFriendsController.getMutualFriendsWithUser({
                userId,
                targetUserId,
                cursor,
                limit,
                type,
            });

            res.status(200).json({
                success: true,
                data: result,
                message: 'Mutual friends retrieved successfully.',
            });
        } catch (error) {
            console.error('Error in getMutualFriends route:', error);

            if (error instanceof Error) {
                if (error.message === 'Unauthorized. User not authenticated.') {
                    res.status(401).json({
                        success: false,
                        message: "Unauthorized. User not authenticated.",
                    });
                    return;
                }

                if (
                    error.message.includes('Cannot get mutual friends with yourself') ||
                    error.message.includes('Target user ID is required') ||
                    error.message.includes('Invalid type') ||
                    error.message.includes('Limit must be')
                ) {
                    res.status(400).json({
                        success: false,
                        message: "Unauthorized. User not authenticated.",
                    });
                    return;
                }

                if (error.message.includes('not found')) {
                    res.status(404).json({
                        success: false,
                        message: "Target user ID is required and must be a valid string",
                    });
                    return;
                }
            }

            res.status(500).json({
                success: false,
                message: 'An error occurred while retrieving mutual friends.',
            });
        }
    }
);

router.delete(
    '/cache',
    authenticate.user_auth,
    async (req: ExtendRequest, res: Response): Promise<void> => {
        try {
            const userId = req.admin?.id;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Unauthorized. User not authenticated.',
                });
                return;
            }

            await MutualFriendsController.clearCache(userId);

            res.status(200).json({
                success: true,
                message: 'Cache invalidated successfully.',
            });
        } catch (error) {
            console.error('Error in invalidateCache route:', error);

            if (error instanceof Error) {
                if (error.message.includes('Target user ID is required')) {
                    res.status(400).json({
                        success: false,
                        message: "Target user ID is required and must be a valid string",
                    });
                    return;
                }
            }

            res.status(500).json({
                success: false,
                message: 'An error occurred while invalidating cache.',
            });
        }
    }
);

export default router;
