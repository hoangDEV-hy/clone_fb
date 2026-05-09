import { methods as pageManagerUserModel } from './Users';
import throwError from '../../Helpers/ThrowErrorOfController';

// ============================================================
// PAGE MANAGER USER CONTROLLER
// Responsibility: Business logic for page manager user operations
// ============================================================

export const PageManagerUserController = {
    /**
     * Select posts with sort
     */
    selectPostWithSort: async (selectedTargetId: string, sort: string): Promise<any> => {
        try {
            return await pageManagerUserModel.selectPostWithSort(selectedTargetId, sort);
        } catch (err) {
            throwError(err);
        }
    },

    /**
     * Select posts
     */
    selectPosts: async (selectedTargetId: string): Promise<any> => {
        try {
            return await pageManagerUserModel.selectPosts(selectedTargetId);
        } catch (err) {
            throwError(err);
        }
    },

    /**
     * Update user name
     */
    updateUser: async (id: string, name: string): Promise<number> => {
        try {
            return await pageManagerUserModel.updateUser(id, name);
        } catch (err) {
            throwError(err);
        }
    },

    /**
     * Update user avatar
     */
    updateAvatarUser: async (id: string, imagePath: string): Promise<number> => {
        try {
            return await pageManagerUserModel.updateAvatarUser(id, imagePath);
        } catch (err) {
            throwError(err);
        }
    },

    /**
     * Update user thumbnail
     */
    updateThumbnailUser: async (id: string, imagePath: string): Promise<number> => {
        try {
            return await pageManagerUserModel.updateThumbnailUser(id, imagePath);
        } catch (err) {
            throwError(err);
        }
    },

    /**
     * Update user information
     */
    updateInformationsUser: async (
        id: string,
        name: string,
        hastag: string,
        hometown: string,
        school: string
    ): Promise<number> => {
        try {
            return await pageManagerUserModel.updateInformationsUser(id, name, hastag, hometown, school);
        } catch (err) {
            throwError(err);
        }
    }
};
