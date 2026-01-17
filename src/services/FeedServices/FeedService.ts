import { PostService } from "./PostService";
import CacheManager from "./ReloadTimingControl";

import FeedConfig from "../../types/Type_FeedConfig";
import { Posts } from "../../models/Model_Post";

export class FeedAggregatorService {
    private postService: PostService;
    private feedCache: CacheManager;
    constructor() {
        this.postService = new PostService();
        this.feedCache = new CacheManager();
    }

    async aggregateFeed(config: FeedConfig): Promise<{
        posts: Posts[];
        nextCursor: number | null;
        hasMore: boolean;
    }> {
        const {
            userId,
            limit = 10,
            cursor,
            sourceRatio = {
                own: 0.30,
                following: 0.25,
                friend: 0.20,
                group: 0.15,
                interest: 0.10
            }
        } = config;

        const counts = {
            own: Math.ceil(limit * sourceRatio.own),
            following: Math.ceil(limit * sourceRatio.following),
            friend: Math.ceil(limit * sourceRatio.friend),
            group: Math.ceil(limit * sourceRatio.group),
            interest: Math.ceil(limit * sourceRatio.interest)
        };

        const [ownPosts, followingPosts, friendPosts, groupPosts, interestPosts] =
            await Promise.all([
                this.postService.getOwnPosts(userId, counts.own, cursor),
                this.postService.getFollowingPosts(userId, counts.following, cursor),
                this.postService.getFriendsPosts(userId, counts.friend, cursor),
                this.postService.getGroupPosts(userId, counts.group, cursor),
                this.postService.getInterestBasedPosts(userId, counts.interest, cursor)
            ]);

        // Combine all posts
        let allPosts = [
            ...(ownPosts || []),
            ...(followingPosts || []),
            ...(friendPosts || []),
            ...(groupPosts || []),
            ...(interestPosts || [])
        ];

        // Deduplicate by post ID
        const uniquePosts = allPosts.filter((post, index, self) =>
            index === self.findIndex(e => e.id === post.id)
        );

        // Sort by engagement score + time
        const sortedPosts = uniquePosts.sort((a, b) => {
            const scoreA = a.engagementScore || 0;
            const scoreB = b.engagementScore || 0;

            if (Math.abs(scoreA - scoreB) > 1) {
                return scoreB - scoreA;
            }

            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        // Take only requested limit
        const finalPosts = sortedPosts.slice(0, limit);

        // Generate next cursor
        const nextCursor = finalPosts.length > 0
            ? finalPosts[finalPosts.length - 1].createdAt.toISOString()
            : null;

        return {
            posts: finalPosts,
            nextCursor,
            hasMore: sortedPosts.length > limit
        };
    }

    clearCache(): void {
        this.feedCache.clear();
    }

    clearUserCache(userId: string): void {
        this.feedCache.clearPattern(userId);
    }
}
