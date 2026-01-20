import CacheManager from "./FeedServices/ReloadTimingControl";
import { methods as methodsUserUser } from "../models/user_user";
import { methods as methodsGroupUser } from "../models/group_user";
import { methods as methodsFollower } from "../models/Model_Follower";
import { methods as methodsUser, User } from "../models/user";

import MutualFriendsParams from "../types/Type_MutualFriendsParams";
import MutualFriendsResult from "../types/Type_MutualFriendsResult";

export class MutualFriendsService {
    private mutualFriends: CacheManager;

    constructor() {
        this.mutualFriends = new CacheManager();
    }

    /**
     * Lấy danh sách gợi ý kết bạn dựa trên kết nối chung
     * Tự động lấy bạn bè hiện tại và lọc ra những người phù hợp chưa là bạn
     */
    async getAllSuggestions(params: MutualFriendsParams): Promise<MutualFriendsResult> {
        const { userId, cursor, limit, type } = params;

        const cacheKey = `suggested_friends:${userId}:${type}:${cursor || 'start'}:${limit}`;

        // Kiểm tra cache
        const cached = this.mutualFriends.get(cacheKey);
        if (cached) {
            return cached;
        }

        // Lấy danh sách bạn bè hiện tại của user
        const currentFriends = await methodsUserUser.selectFriends({ id_userA: userId });
        const currentFriendIds: Set<string> = new Set(
            currentFriends.map(f =>
                f.id_userA === userId ? f.id_userB : f.id_userA
            )
        );

        const [friendsOfFriends, groupMembers, followings] = await Promise.all([
            this.getFriendsOfFriends(userId, currentFriendIds),
            this.getGroupMembers(userId, currentFriendIds),
            this.getFollowingSuggestions(userId, currentFriendIds)
        ]);

        // Tạo map để đếm số lần xuất hiện (điểm ưu tiên)
        const scoreMap = new Map<string, number>();

        // Điểm cho từng loại kết nối
        const weights = {
            friendsOfFriends: 3,  // Bạn của bạn có trọng số cao nhất
            groupMembers: 2,      // Cùng nhóm
            followings: 1         // Cùng follow
        };

        // Tính điểm cho mỗi người
        friendsOfFriends.forEach(id => {
            scoreMap.set(id, (scoreMap.get(id) || 0) + weights.friendsOfFriends);
        });

        groupMembers.forEach(id => {
            scoreMap.set(id, (scoreMap.get(id) || 0) + weights.groupMembers);
        });

        followings.forEach(id => {
            scoreMap.set(id, (scoreMap.get(id) || 0) + weights.followings);
        });

        // Sắp xếp theo điểm từ cao đến thấp
        const sortedSuggestions = Array.from(scoreMap.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([id]) => id);

        // Phân trang với cursor
        const result = await this.paginateUsers(sortedSuggestions, cursor, limit);
        this.mutualFriends.set(cacheKey, result, this.mutualFriends.TTL);

        return result;
    }




    /**
     * Bạn của bạn (Friends of Friends) - chưa là bạn của mình
     */
    private async getFriendsOfFriends(
        userId: string,
        currentFriendIds: Set<string>
    ): Promise<string[]> {
        const userFriends = await methodsUserUser.selectFriends({ id_userA: userId });

        const friendIds = userFriends.map(f =>
            f.id_userA === userId ? f.id_userB : f.id_userA
        );

        if (friendIds.length === 0) return [];

        // Lấy bạn của từng người bạn
        const friendsOfFriendsPromises = friendIds.map(friendId =>
            methodsUserUser.selectFriends({ id_userA: friendId })
        );

        const friendsOfFriendsResults = await Promise.all(friendsOfFriendsPromises);

        const suggestedIds = new Set<string>();

        friendsOfFriendsResults.forEach((friends, index) => {
            friends.forEach(f => {
                const potentialFriendId = f.id_userA === friendIds[index] ? f.id_userB : f.id_userA;

                // Chỉ thêm nếu không phải là chính mình và chưa là bạn
                if (potentialFriendId !== userId && !currentFriendIds.has(potentialFriendId)) {
                    suggestedIds.add(potentialFriendId);
                }
            });
        });

        return Array.from(suggestedIds);
    }

    /**
     * Người trong cùng nhóm - chưa là bạn
     */
    private async getGroupMembers(
        userId: string,
        currentFriendIds: Set<string>
    ): Promise<string[]> {
        // Lấy các nhóm của user
        const userGroups = await methodsGroupUser.selectGroups(userId);
        const groupIds = userGroups.map(g => g.id_group);

        if (groupIds.length === 0) return [];

        // Lấy tất cả thành viên trong các nhóm này
        const groupMembers = await methodsGroupUser.selectGroupMembers(groupIds, userId);

        const suggestedIds = groupMembers
            .map(m => m.id_userA)
            .filter(memberId =>
                memberId !== userId && !currentFriendIds.has(memberId)
            );

        return [...new Set(suggestedIds)];
    }

    /**
     * Người follow cùng người với mình - chưa là bạn
     */
    private async getFollowingSuggestions(
        userId: string,
        currentFriendIds: Set<string>
    ): Promise<string[]> {
        // Lấy danh sách người user đang follow
        const userFollowings = await methodsFollower.selectFollowings(userId);
        const followingIds = userFollowings.map(f => f.following_id);

        if (followingIds.length === 0) return [];

        // Tìm những người khác cũng follow những người này
        const othersFollowingSame = await methodsFollower.othersSameFollowingUsers(
            followingIds,
            userId
        );

        const suggestedIds = othersFollowingSame
            .map(f => f.follower_id)
            .filter(followerId =>
                followerId !== userId && !currentFriendIds.has(followerId)
            );

        return [...new Set(suggestedIds)];
    }

    /**
     * Lấy gợi ý kết bạn cho một người cụ thể (xem có bạn chung không)
     */
    async getMutualFriendsWithUser(
        params: MutualFriendsParams
    ): Promise<MutualFriendsResult> {
        const { userId, cursor, limit, targetUserId } = params;
        const cacheKey = `mutual_with:${userId}:${targetUserId}`;

        const cached = this.mutualFriends.get(cacheKey);
        if (cached) {
            return cached;
        }

        // Lấy bạn bè của cả hai
        const [userFriends, targetFriends] = await Promise.all([
            methodsUserUser.selectFriends({ id_userA: userId }),
            methodsUserUser.selectFriends({ id_userA: targetUserId })
        ]);

        const userFriendIds = new Set(
            userFriends.map(f => f.id_userA === userId ? f.id_userB : f.id_userA)
        );

        const targetFriendIds = targetFriends.map(f =>
            f.id_userA === targetUserId ? f.id_userB : f.id_userA
        );

        // Tìm bạn chung
        const mutualFriendIds = targetFriendIds.filter(id =>
            userFriendIds.has(id) && id !== userId && id !== targetUserId
        );


        const result = this.paginateUsers(mutualFriendIds, cursor, limit);
        this.mutualFriends.set(cacheKey, result, this.mutualFriends.TTL);
        return result;

    }

    /**
     * Phân trang với cursor
     */
    private async paginateUsers(
        userIds: string[],
        cursor: string | undefined,
        limit: number
    ): Promise<MutualFriendsResult> {
        if (userIds.length === 0) {
            return {
                users: [],
                nextCursor: null,
                hasMore: false,
                total: 0
            };
        }

        let startIndex = 0;
        if (cursor) {
            const cursorIndex = userIds.indexOf(cursor);
            if (cursorIndex !== -1) {
                startIndex = cursorIndex + 1;
            }
        }

        const paginatedIds = userIds.slice(startIndex, startIndex + limit);

        // Lấy thông tin chi tiết user
        const users = await methodsUser.selectUsersWithOrder(paginatedIds);

        const hasMore = startIndex + limit < userIds.length;
        const nextCursor = hasMore && users.length > 0
            ? users[users.length - 1].id
            : null;

        return {
            users: users.map((u: User) => u.toJSON()),
            nextCursor,
            hasMore,
            total: userIds.length
        };
    }

    /**
     * Xóa cache khi có thay đổi (kết bạn mới, rời nhóm, etc.)
     */
    async invalidateCache(userId: string, targetUserId?: string): Promise<void> {
        if (targetUserId) {
            this.mutualFriends.clearPattern(`suggested_friends:${userId}`);
            this.mutualFriends.clearPattern(`suggested_friends:${targetUserId}`);
            this.mutualFriends.clearPattern(`mutual_with:${userId}:${targetUserId}`);
            this.mutualFriends.clearPattern(`mutual_with:${targetUserId}:${userId}`);
        } else {
            this.mutualFriends.clearPattern(`suggested_friends:${userId}`);
            this.mutualFriends.clearPattern(`mutual_with:${userId}`);
        }
    }
}

export const mutualFriendsService = new MutualFriendsService();