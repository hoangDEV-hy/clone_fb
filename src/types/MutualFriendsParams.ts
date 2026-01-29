export default interface MutualFriendsParams {
    userId: string;
    targetUserId: string;
    cursor?: string;
    limit: number;
    type?: 'friends' | 'groups' | 'followings' | 'all';
}