export default interface FeedConfig {
    userId: string;
    limit?: number;
    cursor?: string;
    sourceRatio?: {
        own: number;
        following: number;
        friend: number;
        group: number;
        interest: number;
    };
}