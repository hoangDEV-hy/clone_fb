import { Posts } from "../../Models/Post";
import contentOfPost from '../../Types/ContentOfPost';
import contain_posts from '../../Types/ContainPost';

export default function transformPosts(posts: Posts[]): contain_posts[] {
    const tranPosts = posts.map((p: contain_posts) => p.toJSON ? p.toJSON() : p);

    tranPosts.forEach((post: contain_posts) => {
        // Parse contens if it's a string
        if (typeof post.contens === 'string') {
            try {
                while (typeof post.contens === 'string') {
                    post.contens = JSON.parse(post.contens);
                }
            } catch (e) {
                console.warn('Failed to parse contens:', e);
            }
        }

        // Ensure contens has correct structure
        if (post.contens && typeof post.contens === 'object') {
            post.contens = {
                text: post.contens.text,
                image: post.contens.image
            };
        }
    });

    return tranPosts;
}