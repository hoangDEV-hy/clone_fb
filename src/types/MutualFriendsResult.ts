export default interface MutualFriendsResult {
    users: any[];
    nextCursor: string | null;
    hasMore: boolean;
    total: number;
}