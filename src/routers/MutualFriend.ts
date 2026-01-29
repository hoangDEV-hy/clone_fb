import { Router, Request, Response } from 'express';
import { mutualFriendsController } from '../Constrollers/MutualFriends';
import { authenticate } from '../Middlewares/Auth';
import ExtendRequest from '../Types/ExtendRequest';

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

            const limit = mutualFriendsController.validateLimit(req.query.limit);
            const type = mutualFriendsController.validateType(req.query.type);
            const cursor = req.query.cursor as string | undefined;
            const targetUserId = "";

            const result = await mutualFriendsController.getAllSuggestions({
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
            return;
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
                error:
                    process.env.NODE_ENV === 'development'
                        ? error instanceof Error
                            ? "An error occurred while retrieving suggested friends."
                            : 'Unknown error'
                        : undefined,
            });
            return;
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

            const targetUserId = mutualFriendsController.validateTargetUserId(
                req.query.targetUserId
            );
            const limit = mutualFriendsController.validateLimit(req.query.limit);
            const type = mutualFriendsController.validateType(req.query.type);
            const cursor = req.query.cursor as string | undefined;

            const result = await mutualFriendsController.getMutualFriendsWithUser({
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
            return;
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
                error:
                    process.env.NODE_ENV === 'development'
                        ? error instanceof Error
                            ? "An error occurred while retrieving mutual friends."
                            : 'Unknown error'
                        : undefined,
            });
            return;
        }
    }
);


/**
 * @route   DELETE /api/mutual-friends/cache/:targetUserId
 * @desc    Xóa cache mutual friends của một cặp user cụ thể
 * @access  Private
 */
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

            // const targetUserId = mutualFriendsController.validateTargetUserId(
            //     req.params.targetUserId
            // );

            await mutualFriendsController.clearCache(userId);

            res.status(200).json({
                success: true,
                message: 'Cache invalidated successfully.',
            });
            return;
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
                error:
                    process.env.NODE_ENV === 'development'
                        ? error instanceof Error
                            ? "An error occurred while invalidating cache."
                            : 'Unknown error'
                        : undefined,
            });
            return;
        }
    }
);

/**
 * @route   DELETE /api/mutual-friends/cache
 * @desc    Xóa toàn bộ cache mutual friends của user hiện tại
 * @access  Private
 */
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

            await mutualFriendsController.clearCache(userId);

            res.status(200).json({
                success: true,
                message: 'All cache invalidated successfully.',
            });
            return;
        } catch (error) {
            console.error('Error in invalidateAllCache route:', error);

            res.status(500).json({
                success: false,
                message: 'An error occurred while invalidating cache.',
                error:
                    process.env.NODE_ENV === 'development'
                        ? error instanceof Error
                            ? "An error occurred while invalidating cache."
                            : 'Unknown error'
                        : undefined,
            });
            return;
        }
    }
);

export { router };
