import { MutualFriendsService } from '../Services/MutualFriendsServices';
import MutualFriendsParams from '../Types/MutualFriendsParams';
import MutualFriendsResult from '../Types/MutualFriendsResult';

// ============================================================
// MUTUAL FRIENDS CONTROLLER
// Responsibility: Business logic for mutual friends operations
// ============================================================

export const MutualFriendsController = {
    service: new MutualFriendsService(),

    /**
     * Get mutual friends between two users or suggestion friends (by type)
     */
    getMutualFriendsWithUser: async (options: MutualFriendsParams): Promise<MutualFriendsResult> => {
        const { userId, targetUserId, cursor, limit, type } = options;

        const params: MutualFriendsParams = {
            userId,
            targetUserId,
            cursor,
            limit,
            type
        };

        const result = await MutualFriendsController.service.getMutualFriendsWithUser(params);
        return result;
    },

    /**
     * Get suggestion friends
     */
    getAllSuggestions: async (options: MutualFriendsParams): Promise<MutualFriendsResult> => {
        const { userId, targetUserId, cursor, limit, type } = options;

        const params: MutualFriendsParams = {
            userId,
            targetUserId,
            cursor,
            limit,
            type
        };

        const result = await MutualFriendsController.service.getAllSuggestions(params);
        return result;
    },

    /**
     * Clear mutual friends cache for specific user pair
     */
    clearCache: async (userId: string, targetUserId?: string): Promise<void> => {
        await MutualFriendsController.service.invalidateCache(userId, targetUserId);
    },

    /**
     * Validate limit parameter
     */
    validateLimit: (limit: any): number => {
        const parsedLimit = parseInt(limit) || 20;

        if (parsedLimit < 1 || parsedLimit > 100) {
            throw new Error('Limit must be between 1 and 100');
        }

        return parsedLimit;
    },

    /**
     * Validate type parameter
     */
    validateType: (type: any): 'friends' | 'groups' | 'followings' | 'all' => {
        const validTypes = ['all', 'friends', 'groups', "followings"];
        const mutualType = (type as string) || 'all';

        if (!validTypes.includes(mutualType)) {
            throw new Error(`Invalid type. Must be one of: ${validTypes.join(', ')}`);
        }

        return mutualType as 'friends' | 'groups' | 'followings' | 'all';
    },

    /**
     * Validate target user ID
     */
    validateTargetUserId: (targetUserId: any): string => {
        if (!targetUserId || typeof targetUserId !== 'string' || targetUserId.trim() === '') {
            throw new Error('Target user ID is required and must be a valid string');
        }

        return targetUserId.trim();
    }
};
