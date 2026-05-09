import { FeedAggregatorService } from '../Services/FeedServices/FeedService';
import { UserController } from './UserController';

import { Op } from 'sequelize';
import { Posts } from '../Models/Post';
import { User } from '../Models/user';
import { user_user } from '../Models/UserUser';
import throwError from '../Helpers/ThrowErrorOfController';

interface FeedOptions {
    userId: string;
    limit: number;
    cursor?: string;
}

interface FeedResult {
    posts: Posts[];
    nextCursor: number | null;
    hasMore: boolean;
}

// ============================================================
// FEED CONTROLLER
// Responsibility: Business logic for feed operations
// ============================================================

export const FeedController = {
    aggregator: new FeedAggregatorService(),

    /**
     * Get aggregated feed for user
     */
    getFeed: async (options: FeedOptions): Promise<FeedResult> => {
        const { userId, limit, cursor } = options;

        const result = await FeedController.aggregator.aggregateFeed({
            userId,
            limit,
            cursor
        });
        return {
            posts: result.posts,
            nextCursor: result.nextCursor,
            hasMore: result.hasMore
        };
    },

    /**
     * Get user by ID
     */
    getUser: async (userId: string): Promise<User | null> => {
        try {
            const user = await UserController.selectUser(userId);

            if (!user) {
                throw new Error('User not found');
            }

            return user;
        } catch (err) {
            throwError(err);
        }
    },

    /**
     * Get friend list for user
     */
    getFriendList: async (userId: string): Promise<any[]> => {
        const friendRelations = await user_user.findAll({
            where: {
                status: 'done',
                [Op.or]: [
                    { id_userA: userId },
                    { id_userB: userId }
                ]
            },
            attributes: ['id_userB', 'id_userA'],
            include: [
                {
                    model: User,
                    as: 'userA',
                    attributes: ['id', 'name', 'avatar']
                },
                {
                    model: User,
                    as: 'userB',
                    attributes: ['id', 'name', 'avatar']
                }
            ]
        });

        return friendRelations
            .map((relation: any) => {
                const friend = relation.id_userA === userId
                    ? relation.userB
                    : relation.userA;

                if (!friend) return null;

                return friend.toJSON();
            })
            .filter(Boolean);
    },

    /**
     * Clear user feed cache
     */
    clearCache: async (userId: string): Promise<void> => {
        FeedController.aggregator.clearUserCache(userId);
    },

    /**
     * Validate limit parameter
     */
    validateLimit: (limit: any): number => {
        const parsedLimit = parseInt(limit) || 10;

        if (parsedLimit < 1 || parsedLimit > 50) {
            throw new Error('Limit must be between 1 and 50');
        }

        return parsedLimit;
    }
};
