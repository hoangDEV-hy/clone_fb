import { methods as postController } from '../Posts'
import { methods as groupController } from '../group/group'


import { Group } from '../../models/group';
import { Posts } from '../../models/Posts';
import throwError from '../../helpers/ThrowErrorOfController';
import contentOfPost from '../../types/ContentOfPost';
import contain_posts from '../../types/ContainPost';


export const methods = {
    loadPosts: async (selectedIdUser: string, selectedIdGroup: number): Promise<contain_posts[]> => {
        try {

            if (!selectedIdGroup) {
                throw new Error('selectedIdGroup is required');
            }
            //const selectedGroup = await groupController.selectGroup(selectedIdGroup);
            const selectedContainPosts = await postController.selectPostsWithUser({ user_id: selectedIdUser, group_id: selectedIdGroup, scope: 'group' });
            if (!selectedContainPosts || selectedContainPosts.length === 0) {
                return [];
            }
            const transformer_post: contain_posts[] = selectedContainPosts.map((b: contain_posts) => {

                b = b.toJSON() as contain_posts;

                let contenObj: contentOfPost | string = b.contens;
                try {
                    // Parse JSON nhiều tầng nếu cần
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
    delPost: async (id: number): Promise<number> => {
        try {
            return postController.delPost({ id: id })
        } catch (err) {
            throwError(err);
        }
    },
    selectPostsWithFilter_InteractionAndUser: async (selectedGroupId: number, scope: string, sort: string, selectedIdUser?: string): Promise<Posts[]> => {
        try {
            return await postController.selectPostsWithFilter_InteractionAndUser(selectedGroupId, scope, sort, selectedIdUser);
        } catch (err) {
            throwError(err);
        }
    },
    selectGroup: async (id: number): Promise<Group | null> => {
        try {
            return await groupController.selectGroup(id);
        } catch (err) {
            throwError(err);
        }
    }
}