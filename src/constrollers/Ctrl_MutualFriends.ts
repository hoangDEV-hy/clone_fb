import { MutualFriendsService } from '../services/MutualFriendsServices';
import MutualFriendsParams from '../types/Type_MutualFriendsParams';
import MutualFriendsResult from '../types/Type_MutualFriendsResult';

export class MutualFriendsController {
    private service: MutualFriendsService;

    constructor() {
        this.service = new MutualFriendsService();
    }

    /**
     * Get mutual friends between two users or suggestion friends ( by type)
     * @throws Error if users are the same or not found
     */
    async getMutualFriendsWithUser(options: MutualFriendsParams): Promise<MutualFriendsResult> {
        const { userId, targetUserId, cursor, limit, type } = options;

        const params: MutualFriendsParams = {
            userId,
            targetUserId,
            cursor,
            limit,
            type
        };

        const result = await this.service.getMutualFriendsWithUser(params);
        return result;
    }
    /**
     * Get suggestion friends
     * @throws Error if users are the same or not found
     */
    async getAllSuggestions(options: MutualFriendsParams): Promise<MutualFriendsResult> {
        const { userId, targetUserId, cursor, limit, type } = options;

        const params: MutualFriendsParams = {
            userId,
            targetUserId,
            cursor,
            limit,
            type
        };

        const result = await this.service.getAllSuggestions(params);
        return result;
    }


    /**
     * Clear mutual friends cache for specific user pair
     */
    async clearCache(userId: string, targetUserId?: string): Promise<void> {
        await this.service.invalidateCache(userId, targetUserId);
    }

    /**
     * Validate limit parameter
     * @returns validated limit or throws error
     */
    validateLimit(limit: any): number {
        const parsedLimit = parseInt(limit) || 20;

        if (parsedLimit < 1 || parsedLimit > 100) {
            throw new Error('Limit must be between 1 and 100');
        }

        return parsedLimit;
    }

    /**
     * Validate type parameter
     * @returns validated type or throws error
     */
    validateType(type: any): 'friends' | 'groups' | 'followings' | 'all' {
        const validTypes = ['all', 'friends', 'groups', "followings"];
        const mutualType = (type as string) || 'all';

        if (!validTypes.includes(mutualType)) {
            throw new Error(`Invalid type. Must be one of: ${validTypes.join(', ')}`);
        }

        return mutualType as 'friends' | 'groups' | 'followings' | 'all';
    }

    /**
     * Validate target user ID
     * @throws Error if targetUserId is invalid
     */
    validateTargetUserId(targetUserId: any): string {
        console.log('targetUserId', targetUserId)
        if (!targetUserId || typeof targetUserId !== 'string' || targetUserId.trim() === '') {
            throw new Error('Target user ID is required and must be a valid string');
        }

        return targetUserId.trim();
    }
}

export const mutualFriendsController = new MutualFriendsController();