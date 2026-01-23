import transformPosts from "../services/FeedServices/TransformPosts";

import { Posts } from "../models/Posts";
import contentOfPost from "../types/ContentOfPost";

export const transformPostServices = {
    transformPosts: transformPosts,
    transformPostReturnContent: (post: Posts): contentOfPost => {
        let contens: any = post.contens;

        if (typeof contens === 'string') {
            try {
                while (typeof contens === 'string') {
                    contens = JSON.parse(contens);
                }
            } catch (e) {
                console.warn('Failed to parse contens:', e);
            }
        }

        return {
            text: contens?.text,
            image: contens?.image
        };
    }
}
