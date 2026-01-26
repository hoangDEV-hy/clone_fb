import { methods as postModel, Posts } from "../models/Posts";
import throwError from "../helpers/ThrowErrorOfController";
import { methods as userController } from "../constrollers/User"

import { User } from "../models/user";
import { WhereOptions } from "sequelize";
import { user_user } from "../models/user_user";
import { group_user } from "../models/group_user";


export let methods = {
    selectPostWithUserAndGroup: async (selectedPostIdCurtain: number): Promise<Posts | null> => {
        try {
            return await postModel.selectPostWithUserAndGroup(selectedPostIdCurtain);
        } catch (err) {
            throwError(err);
        }
    },
    selectPostsWithUserAndGroup: async (selectedTargetId: string): Promise<Posts[]> => {
        try {
            return await postModel.selectPostsWithUserAndGroup(selectedTargetId);
        } catch (err) {
            throwError(err);
        }
    },
    selectPostWithUserGroupAndCountInteraction: async (selectedTargetId: string, selectedSort: string): Promise<Posts[]> => {
        try {
            return await postModel.selectPostWithUserGroupAndCountInteraction(selectedTargetId, selectedSort);
        } catch (err) {
            throwError(err);
        }
    },
    create: async (selectedPostIdOrigin: number, selectedUserId: string, selectedGroupId: number, selectedContent: string, selectedScope: string, selectedThink: string): Promise<Posts | null> => {
        try {
            return await postModel.create({ PostId_origin: selectedPostIdOrigin, user_id: selectedUserId, group_id: selectedGroupId, contens: selectedContent, scope: selectedScope, think: selectedThink });
        } catch (err) {
            throwError(err);
        }
    },
    update: async (selectedPostIdOrigin: number, selectedPostIdCurtain: number, selectedContent: string, selectedScope: string, selectedThink: string): Promise<number> => {
        try {
            const [affectedCount] = await postModel.up({ PostId_origin: selectedPostIdOrigin, contens: selectedContent, scope: selectedScope, think: selectedThink }, { id: selectedPostIdCurtain })
            return affectedCount;
        } catch (err) {
            throwError(err);
        }
    },
    selectPostsWithUser: async (data: Partial<Posts>) => {
        try {
            return await postModel.selectPostsWithUser(data);
        } catch (err) {
            throwError(err);
        }
    },
    delPost: async (idPost: number): Promise<number> => {
        try {
            return postModel.des({ id: idPost });
        } catch (err) {
            throwError(err);
        }
    },
    selectPostsWithFilter_InteractionAndUser: async (selectedGroupId: number, scope: string, sort: string, selectedIdUser?: string): Promise<Posts[]> => {
        try {
            const whereCondition: Partial<Posts> = {
                group_id: selectedGroupId,
                scope
            };

            if (selectedIdUser) {
                whereCondition.user_id = selectedIdUser;
            }

            return postModel.selectPostsWithFilter_InteractionAndUser(
                whereCondition,
                sort
            );
        }
        catch (err) {
            throwError(err);
        }
    },
    selectUser: async (selectedIdUser: string): Promise<User | null> => {
        try {
            return await userController.selectUser(selectedIdUser);
        } catch (err) {
            throwError(err);
        }
    },
    selectPostsWithUserAndInteraction: async (whereClause: WhereOptions, limit: number): Promise<Posts[]> => {
        try {
            return postModel.selectPostsWithUserAndInteraction(whereClause, limit);
        } catch (err) {
            throwError(err);
        }
    },

    selectFriendsPost: async (selectedUserId: string): Promise<user_user[]> => {
        try {
            return postModel.selectFriendsPost(selectedUserId);
        } catch (err) {
            throwError(err);
        }
    },
    selectGroupsPost: async (selectedUserId: string): Promise<group_user[]> => {
        try {
            return postModel.selectGroupsPost(selectedUserId);
        } catch (err) {
            throwError(err);
        }
    },
    selectIdGroups: async (selectedUserId: string): Promise<group_user[]> => {
        try {
            return postModel.selectIdGroups(selectedUserId);
        } catch (err) {
            throwError(err);
        }
    },
    selectSameGroupUsers: async (selectedUserId: string, selectGroupsId: number[]): Promise<group_user[]> => {
        try {
            return postModel.selectSameGroupUsers(selectGroupsId, selectedUserId);
        } catch (err) {
            throwError(err);
        }
    },
    selectPostById: async (selectedGroupId: number): Promise<Posts | null> => {
        try {
            return await postModel.selectPost({ id: selectedGroupId });
        } catch (err) {
            throwError(err);
        }
    }
}