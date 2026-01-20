import { FeedAggregatorService } from '../services/FeedServices/FeedService';
import { methods as userController } from '../constrollers/User';

import { Op } from 'sequelize';
import { Posts } from '../models/Posts';


import { User } from '../models/user';
import { user_user } from '../models/user_user';
import throwError from '../helpers/ThrowErrorOfController';
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

export class FeedController {
    private aggregator: FeedAggregatorService;

    constructor() {
        this.aggregator = new FeedAggregatorService();
    }

    /**
     * Get aggregated feed for user
     * @throws Error if user not found or feed fetch fails
     */
    async getFeed(options: FeedOptions): Promise<FeedResult> {
        const { userId, limit, cursor } = options;

        const result = await this.aggregator.aggregateFeed({
            userId,
            limit,
            cursor
        });
        return {
            posts: result.posts,
            nextCursor: result.nextCursor,
            hasMore: result.hasMore
        };
    }

    /**
     * Get user by ID
     * @throws Error if user not found
     */
    async getUser(userId: string): Promise<User | null> {
        try {

            const user = await userController.selectUser(userId);

            if (!user) {
                throw new Error('User not found');
            }

            return user;
        } catch (err) {
            throwError(err);
        }
    }

    /**
     * Get friend list for user
     * @returns Array of friend objects
     */
    async getFriendList(userId: string): Promise<any[]> {
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

        return friendRelations.map((relation: any) => {
            const friend = relation.id_userA === userId
                ? relation.userB
                : relation.userA;
            return friend.toJSON();
        });
    }

    /**
     * Clear user feed cache
     */
    async clearCache(userId: string): Promise<void> {
        this.aggregator.clearUserCache(userId);
    }

    /**
     * Validate limit parameter
     * @returns validated limit or throws error
     */
    validateLimit(limit: any): number {
        const parsedLimit = parseInt(limit) || 10;

        if (parsedLimit < 1 || parsedLimit > 50) {
            throw new Error('Limit must be between 1 and 50');
        }

        return parsedLimit;
    }
}