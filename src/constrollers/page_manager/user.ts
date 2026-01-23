import { User, methods as userModel } from '../../models/user'; // đường dẫn model tùy theo dự án của bạn
import throwError from '../../helpers/ThrowErrorOfController';
import { methods as postController } from '../Posts'
import { transformPostServices } from '../../helpers/TransformerPost';

import contain_posts from '../../types/ContainPost';



export let methods = {
    takeUser: async (id: string): Promise<User | null> => {
        try {
            return await userModel.selectUser({ id: id });
        } catch (err) {
            throwError(err);
        }
    },
    updateUser: async (id: string, name: string): Promise<number> => {
        try {
            return userModel.updateUser({ name: name }, id);
        }
        catch (err) {
            throwError(err);
        }
    },
    updateAvatarUser: async (id: string, imagePath: string): Promise<number> => {
        try {

            return await userModel.updateUser({ avatar: imagePath }, id);
        } catch (err) {
            throwError(err);
        }
    },
    updateThumbnailUser: async (id: string, imagePath: string): Promise<number> => {
        try {

            return await userModel.updateUser({ thumbnail: imagePath }, id);
        } catch (err) {
            throwError(err);
        }
    },
    updateInformationsUser: async (id: string, name: string, hastag: string, hometown: string, school: string): Promise<number> => {
        try {
            return await userModel.updateUser({ name: name, alias: hastag, hometown: hometown, school: school }, id);
        } catch (err) {
            throwError(err);
        }
    },
    selectPostWithSort: async (
        selectedTargetId: string,
        selectedSort: string
    ): Promise<contain_posts[] | null> => {
        try {
            const selectedPosts =
                await postController.selectPostWithUserGroupAndCountInteraction(
                    selectedTargetId,
                    selectedSort
                );

            if (selectedPosts.length > 0) {
                return transformPostServices.transformPosts(selectedPosts);
            }

            return null;
        } catch (err) {
            throwError(err);
        }
    },
    selectPosts: async (
        selectedTargetId: string
    ): Promise<contain_posts[] | null> => {
        try {
            const selectedPosts =
                await postController.selectPostsWithUserAndGroup(
                    selectedTargetId
                );

            if (selectedPosts.length > 0) {
                return transformPostServices.transformPosts(selectedPosts);
            }

            return null;
        } catch (err) {
            throwError(err);
        }
    }

}




