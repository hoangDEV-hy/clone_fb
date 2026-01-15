import { methods as postMethods } from '../../models/Posts'
import transformPosts from './TransformPosts'
import { methods as followerMethods } from '../../models/Model_Follower'
import feedCache from './ReloadTimingControl'

import { WhereOptions, Op } from 'sequelize';
export class PostService {

    /**
     * Calculate engagement score for posts
     */
    private calculateEngagementScore(post: any): number {
        const now = Date.now();
        const postTime = new Date(post.createdAt).getTime();

        const hoursSincePost = Math.max(
            0,
            (now - postTime) / (1000 * 60 * 60)
        );

        const timeFactor = Math.max(0.1, 1 - hoursSincePost * 0.05);

        const likes =
            post.interactions?.filter((i: any) => i.classify === 'like').length || 0;

        const comments =
            post.interactions?.filter((i: any) => i.classify === 'commend').length || 0;

        const shares =
            post.interactions?.filter((i: any) => i.classify === 'share').length || 0;

        const engagementPoints = likes * 1 + comments * 3 + shares * 5;
        const recentBoost = hoursSincePost < 24 ? 1.5 : 1;

        return engagementPoints * timeFactor * recentBoost;
    }


    /**
     * 1. Bài viết của chính user
     */
    async getOwnPosts(userId: string, limit: number, cursor?: string): Promise<any[]> {
        const cacheKey = `own:${userId}:${cursor || 'start'}`;
        const cached = feedCache.get(cacheKey);
        if (cached) return cached;

        const whereClause: WhereOptions = {
            user_id: userId,
            scope: { [Op.in]: ['public', 'friends', 'only_me'] }
        };

        if (cursor) {
            whereClause.createdAt = { [Op.lt]: new Date(cursor) };
        }

        const posts = await postMethods.selectPosts(whereClause, limit)

        // Transform and calculate engagement
        const transformed = transformPosts(posts);
        const postsWithScore = transformed.map((post: any) => {
            post.engagementScore = this.calculateEngagementScore(post);
            post.source = 'own';
            return post;
        });

        const sorted = postsWithScore
            .sort((a, b) => (b.engagementScore || 0) - (a.engagementScore || 0))
            .slice(0, limit);

        feedCache.set(cacheKey, sorted);
        return sorted;
    }

    /**
     * 2. Bài viết từ người user theo dõi
     */
    async getFollowingPosts(userId: string, limit: number, cursor?: string): Promise<any[]> {
        const cacheKey = `following:${userId}:${cursor || 'start'}`;
        const cached = feedCache.get(cacheKey);
        if (cached) return cached;

        const followings = await followerMethods.selectFollowings(userId);

        const followingIds = followings.map(f => f.following_id);
        if (followingIds.length === 0) return [];

        const whereClause: any = {
            user_id: { [Op.in]: followingIds },
            scope: { [Op.in]: ['public', 'friends'] }
        };

        if (cursor) {
            whereClause.createdAt = { [Op.lt]: new Date(cursor) };
        }

        const posts = await postMethods.selectPosts(whereClause, limit);

        const transformed = transformPosts(posts);
        const postsWithScore = transformed.map((post: any) => {
            post.engagementScore = this.calculateEngagementScore(post);
            post.source = 'following';
            return post;
        });

        const sorted = postsWithScore
            .sort((a, b) => (b.engagementScore || 0) - (a.engagementScore || 0))
            .slice(0, limit);

        feedCache.set(cacheKey, sorted);
        return sorted;
    }

    /**
     * 3. Bài viết từ bạn bè
     */
    async getFriendsPosts(userId: string, limit: number, cursor?: string): Promise<any[]> {
        const cacheKey = `friends:${userId}:${cursor || 'start'}`;
        const cached = feedCache.get(cacheKey);
        if (cached) return cached;

        const friends = await postMethods.selectFriendsPost(userId);

        // Flatten posts from friends
        const allPosts = friends.flatMap((f: any) => f.Posts || []);

        if (allPosts.length === 0) return [];

        const transformed = transformPosts(allPosts);
        const postsWithScore = transformed.map((post: any) => {
            post.engagementScore = this.calculateEngagementScore(post);
            post.source = 'friend';

            return post;
        });

        // Apply cursor filter if needed
        let filtered = postsWithScore;
        if (cursor) {
            const cursorDate = new Date(cursor);
            filtered = postsWithScore.filter((p: any) => new Date(p.createdAt) < cursorDate);
        }

        const sorted = filtered
            .sort((a, b) => (b.engagementScore || 0) - (a.engagementScore || 0))
            .slice(0, limit);

        feedCache.set(cacheKey, sorted);
        return sorted;
    }

    /**
     * 4. Bài viết từ groups user tham gia
     */
    async getGroupPosts(userId: string, limit: number, cursor?: string): Promise<any[]> {
        const cacheKey = `group:${userId}:${cursor || 'start'}`;
        const cached = feedCache.get(cacheKey);
        if (cached) return cached;

        const userGroups = await postMethods.selectGroupsPost(userId);

        // Flatten posts from groups
        const allPosts = userGroups.flatMap((g: any) => g.Posts || []);

        if (allPosts.length === 0) return [];

        const transformed = transformPosts(allPosts);
        const postsWithScore = transformed.map((post: any) => {
            post.engagementScore = this.calculateEngagementScore(post);
            post.source = 'group';

            return post;
        });

        // Apply cursor filter if needed
        let filtered = postsWithScore;
        if (cursor) {
            const cursorDate = new Date(cursor);
            filtered = postsWithScore.filter((p: any) => new Date(p.createdAt) < cursorDate);
        }

        const sorted = filtered
            .sort((a, b) => (b.engagementScore || 0) - (a.engagementScore || 0))
            .slice(0, limit);

        feedCache.set(cacheKey, sorted);
        return sorted;
    }

    /**
     * 5. Bài viết dựa trên sở thích chung
     */
    async getInterestBasedPosts(userId: string, limit: number, cursor?: string): Promise<any[]> {
        const cacheKey = `interest:${userId}:${cursor || 'start'}`;
        const cached = feedCache.get(cacheKey);
        if (cached) return cached;

        const userGroups = await postMethods.selectIdGroups(userId);

        const groupIds = userGroups.map(ug => ug.id_group);

        const sameGroupUsers = await postMethods.selectSameGroupUsers(groupIds, userId);

        const userFollowing = await followerMethods.selectIdFollowers(userId);

        const followingIds = userFollowing.map(f => f.following_id);

        const sameFollowingUsers = await followerMethods.sameFollowingUsers(followingIds, userId);

        const interestUserIds = [
            ...new Set([
                ...sameGroupUsers.map(u => u.id_userA),
                ...sameFollowingUsers.map(u => u.follower_id)
            ])
        ];

        if (interestUserIds.length === 0) return [];

        const whereClause: any = {
            user_id: { [Op.in]: interestUserIds },
            scope: 'public'
        };

        if (cursor) {
            whereClause.createdAt = { [Op.lt]: new Date(cursor) };
        }

        const posts = await postMethods.selectPosts(whereClause, limit);

        const transformed = transformPosts(posts);
        const postsWithScore = transformed.map((post: any) => {
            post.engagementScore = this.calculateEngagementScore(post);
            post.source = 'interest';

            return post;
        });

        const sorted = postsWithScore
            .sort((a, b) => (b.engagementScore || 0) - (a.engagementScore || 0))
            .slice(0, limit);

        feedCache.set(cacheKey, sorted);
        return sorted;
    }
}