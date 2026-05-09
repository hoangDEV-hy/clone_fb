import { PostsController } from '../PostsController';
import { GroupController } from '../GroupController';

import { Group } from '../../Models/Group';
import { Posts } from '../../Models/Post';
import throwError from '../../Helpers/ThrowErrorOfController';
import contentOfPost from '../../Types/ContentOfPost';
import contain_posts from '../../Types/ContainPost';

// ============================================================
// PAGE MANAGER POST CONTROLLER
// Responsibility: Business logic for page manager post operations
// ============================================================

export const PageManagerPostController = {
    /**
     * Load posts for page manager
     */
    loadPosts: async (selectedIdUser: string, selectedIdGroup: number): Promise<contain_posts[]> => {
        try {
            if (!selectedIdGroup) {
                throw new Error('selectedIdGroup is required');
            }

            const selectedContainPosts = await PostsController.selectPostsWithUser({
                user_id: selectedIdUser,
                group_id: selectedIdGroup,
                scope: 'group'
            });

            if (!selectedContainPosts || selectedContainPosts.length === 0) {
                return [];
            }

            const transformer_post: contain_posts[] = selectedContainPosts.map((b: contain_posts) => {
                b = b.toJSON() as contain_posts;

                let contenObj: contentOfPost | string = b.contens;
                try {
                    while (typeof contenObj === 'string') {
                        contenObj = JSON.parse(contenObj);
                    }
                } catch (err) {
                    console.error('JSON parse error in post.contens:', {
                        postId: b.id,
                        contens: b.contens
                    });
                    throw new Error('Invalid post content format');
                }

                b.contens = {
                    text: contenObj.text,
                    image: JSON.stringify(contenObj.image)
                }
                return b
            });
            return transformer_post;
        } catch (err) {
            throwError(err);
        }
    },

    /**
     * Delete post
     */
    delPost: async (id: number): Promise<number> => {
        try {
            return await PostsController.delPost(id)
        } catch (err) {
            throwError(err);
        }
    },

    /**
     * Get posts with filter and interaction sorting
     */
    selectPostsWithFilter_InteractionAndUser: async (
        selectedGroupId: number,
        scope: string,
        sort: string,
        selectedIdUser?: string
    ): Promise<Posts[]> => {
        try {
            return await PostsController.selectPostsWithFilter_InteractionAndUser(selectedGroupId, scope, sort, selectedIdUser);
        } catch (err) {
            throwError(err);
        }
    },

    /**
     * Get group by ID
     */
    selectGroup: async (id: number): Promise<Group | null> => {
        try {
            return await GroupController.selectGroup(id);
        } catch (err) {
            throwError(err);
        }
    }
};
