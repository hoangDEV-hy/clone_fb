import { group_user } from "../Models/GroupUser";
import { Group, methods as groupModel } from "../Models/Group";
import { Posts } from "../Models/Post";
import { Op } from "sequelize";
import { sequelize } from "../Configs/Sql";
import { User } from "../Models/user";
import throwError from "../Helpers/ThrowErrorOfController";
import { methods as postController } from "./Posts";
import { methods as userController } from "./User";
import { addNotification, sendNotification } from '../Services/FollowerService';
import NotificationServerTake from '../Types/Notification';
import { transformPostServices } from '../Helpers/TransformerPost';

// ============================================================
// GROUP CONTROLLER
// Responsibility: Business logic for group operations
// ============================================================

export const GroupController = {
    // =====================================================
    // GROUP LIST & POSTS
    // =====================================================

    joinGroup_list: async (id: string): Promise<any> => {
        const resuil = await group_user.findAll({
            where: { id_userA: id, status: 'done' },
            include: [{ model: Group, as: 'groups', required: true }]
        });
        return resuil;
    },

    PostsAll_group: async (id: string): Promise<any> => {
        const userGroups = await group_user.findAll({
            where: { id_userA: id, status: 'done' }
        });

        if (!userGroups || userGroups.length === 0) {
            return [];
        }

        const groupIds = userGroups.map(gu => gu.id_group);

        const posts = await Posts.findAll({
            where: { group_id: { [Op.in]: groupIds }, scope: 'group' },
            include: [
                { model: User, as: 'users', required: true },
                { model: Group, as: 'groups', required: true }
            ]
        });

        const result = userGroups.map(groupUser => ({
            ...groupUser.toJSON(),
            Posts: posts.filter(post => post.group_id === groupUser.id_group)
        }));

        return result.filter(item => item.Posts.length > 0);
    },

    selectGroup: async (id: number): Promise<Group | null> => {
        try {
            return await groupModel.selectGroup({ id: id });
        } catch (err) {
            throwError(err);
        }
    },

    selectGroupsWithName: async (selectedName: string): Promise<Group[] | null> => {
        try {
            return await groupModel.selectGroups({ name: selectedName });
        } catch (err) {
            throwError(err);
        }
    },

    getGroupPostsSorted: async (
        groupId: number,
        userId: string,
        sort: string = 'like'
    ): Promise<Posts[]> => {
        try {
            const scope = "group";
            return await postController.selectPostsWithFilter_InteractionAndUser(
                groupId, scope, sort
            );
        } catch (err) {
            throwError(err);
        }
    },

    getIdAdmin: async (groupId: number): Promise<string | undefined> => {
        try {
            return groupModel.getIdAdmin(groupId);
        } catch (err) {
            throwError(err);
        }
    },

    // =====================================================
    // GROUP MEMBERSHIP
    // =====================================================

    selectGroupsJoined: async (userId: string): Promise<any[]> => {
        try {
            const { group_user: guModel } = await import('../Models/GroupUser');
            const joinedGroupUsers = await guModel.findAll({
                where: { id_userA: userId, status: 'done' },
                raw: false
            });
            const groupIds = joinedGroupUsers.map((gu: any) => gu.id_group);

            if (groupIds.length === 0) {
                return [];
            }

            const groups = await groupModel.selectGroupsGroupuserByOp_in(groupIds);
            return groups.map((g: any) => g.toJSON());
        } catch (err) {
            throwError(err);
        }
    },

    selectGroupsPending: async (userId: string): Promise<any[]> => {
        try {
            const { group_user: guModel } = await import('../Models/GroupUser');
            const pendingGroupUsers = await guModel.findAll({
                where: { id_userA: userId, status: 'pending' },
                raw: false
            });
            const groupIds = pendingGroupUsers.map((gu: any) => gu.id_group);

            if (groupIds.length === 0) {
                return [];
            }

            const groups = await groupModel.selectGroupsGroupuserByOp_in(groupIds);
            return groups.map((g: any) => g.toJSON());
        } catch (err) {
            throwError(err);
        }
    },

    createGroup: async (
        adminId: string,
        name: string,
        hastag?: string
    ): Promise<void> => {
        const transaction = await sequelize.transaction();
        try {
            const existingGroup = await groupModel.selectGroup({ name });
            if (existingGroup) {
                throw new Error('GROUP_NAME_EXISTS');
            }

            const newGroup = await groupModel.createGroup(
                { name, hastag, admin: adminId },
                transaction
            );

            const { group_user: guModel } = await import('../Models/GroupUser');
            await guModel.create(
                { id_userA: adminId, id_group: newGroup.id, status: 'active' },
                { transaction }
            );

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            console.error('Error in createGroup:', error);
            throw error;
        }
    },

    joinGroupRequest: async (
        userId: string,
        groupId: number,
        notification_value: NotificationServerTake
    ): Promise<void> => {
        const transaction = await sequelize.transaction();
        try {
            const group = await groupModel.selectGroup({ id: groupId });
            if (!group) {
                throw new Error('GROUP_NOT_FOUND');
            }

            const { group_user: guModel } = await import('../Models/GroupUser');
            const existingMember = await guModel.findOne({
                where: { id_userA: userId, id_group: groupId }
            });
            if (existingMember) {
                throw new Error('ALREADY_MEMBER');
            }

            await guModel.create(
                { id_userA: userId, id_group: groupId, status: 'pending' },
                { transaction }
            );

            const notificationResult = await addNotification(notification_value, transaction);

            await transaction.commit();

            sendNotification(notificationResult.id, notification_value);
        } catch (error) {
            await transaction.rollback();
            console.error('Error in joinGroupRequest:', error);
            throw error;
        }
    },

    acceptJoinRequest: async (
        adminId: string,
        groupId: number,
        userId: string,
        notification_value: NotificationServerTake
    ): Promise<void> => {
        const transaction = await sequelize.transaction();
        try {
            const group = await groupModel.selectGroup({ id: groupId });
            if (!group || group.admin !== adminId) {
                throw new Error('NOT_GROUP_ADMIN');
            }

            const { group_user: guModel } = await import('../Models/GroupUser');
            const updated = await guModel.update(
                { status: 'active' },
                { where: { id_userA: userId, id_group: groupId, status: 'pending' }, transaction }
            );

            if (updated[0] === 0) {
                throw new Error('REQUEST_NOT_FOUND');
            }

            const notificationResult = await addNotification(notification_value, transaction);

            await transaction.commit();

            sendNotification(notificationResult.id, notification_value);
        } catch (error) {
            await transaction.rollback();
            console.error('Error in acceptJoinRequest:', error);
            throw error;
        }
    },

    rejectJoinRequest: async (
        currentUserId: string,
        groupId: number,
        targetUserId: string,
        notification_value: NotificationServerTake
    ): Promise<void> => {
        const transaction = await sequelize.transaction();
        try {
            const group = await groupModel.selectGroup({ id: groupId });
            if (!group) {
                throw new Error('GROUP_NOT_FOUND');
            }

            const isAdmin = group.admin === currentUserId;
            const isSelf = currentUserId === targetUserId;

            if (!isAdmin && !isSelf) {
                throw new Error('UNAUTHORIZED');
            }

            const { group_user: guModel } = await import('../Models/GroupUser');
            const deleted = await guModel.destroy({
                where: { id_userA: targetUserId, id_group: groupId, status: 'pending' },
                transaction
            });

            if (deleted === 0) {
                throw new Error('REQUEST_NOT_FOUND');
            }

            if (isSelf) {
                await transaction.commit();
                return;
            }

            if (isAdmin) {
                notification_value.content = `Yêu cầu tham gia nhóm ${groupId} đã bị từ chối`;
            }

            const notificationResult = await addNotification(notification_value, transaction);

            await transaction.commit();

            sendNotification(notificationResult.id, notification_value);
        } catch (error) {
            await transaction.rollback();
            console.error('Error in rejectJoinRequest:', error);
            throw error;
        }
    },

    leaveGroup: async (userId: string, groupId: number): Promise<void> => {
        const transaction = await sequelize.transaction();
        try {
            const group = await groupModel.selectGroup({ id: groupId });
            if (!group) {
                throw new Error('GROUP_NOT_FOUND');
            }

            if (group.admin === userId) {
                throw new Error('CANNOT_LEAVE_AS_ADMIN');
            }

            const { group_user: guModel } = await import('../Models/GroupUser');
            const deleted = await guModel.destroy({
                where: { id_userA: userId, id_group: groupId, status: 'active' },
                transaction
            });

            if (deleted === 0) {
                throw new Error('NOT_A_MEMBER');
            }

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            console.error('Error in leaveGroup:', error);
            throw error;
        }
    },

    checkMembershipStatus: async (
        userId: string,
        groupId: number
    ): Promise<{ exists: boolean; status?: string; isAdmin?: boolean }> => {
        try {
            const { group_user: guModel } = await import('../Models/GroupUser');
            const membership = await guModel.findOne({
                where: { id_userA: userId, id_group: groupId }
            });

            if (!membership) {
                return { exists: false };
            }

            const group = await groupModel.selectGroup({ id: groupId });
            const isAdmin = group?.admin === userId;

            return {
                exists: true,
                status: membership.status,
                isAdmin
            };
        } catch (error) {
            console.error('Error in checkMembershipStatus:', error);
            throw error;
        }
    },

    removeMember: async (
        adminId: string,
        groupId: number,
        targetUserId: string,
        notification_value: NotificationServerTake
    ): Promise<void> => {
        const transaction = await sequelize.transaction();
        try {
            const group = await groupModel.selectGroup({ id: groupId });
            if (!group || group.admin !== adminId) {
                throw new Error('NOT_GROUP_ADMIN');
            }

            if (targetUserId === adminId) {
                throw new Error('CANNOT_REMOVE_ADMIN');
            }

            const { group_user: guModel } = await import('../Models/GroupUser');
            const deleted = await guModel.destroy({
                where: { id_userA: targetUserId, id_group: groupId, status: 'active' },
                transaction
            });

            if (deleted === 0) {
                throw new Error('NOT_A_MEMBER');
            }

            const notificationResult = await addNotification(notification_value, transaction);

            await transaction.commit();

            sendNotification(notificationResult.id, notification_value);
        } catch (error) {
            await transaction.rollback();
            console.error('Error in removeMember:', error);
            throw error;
        }
    },

    getGroupMembers: async (
        userId: string,
        groupId: number,
        searchName?: string
    ): Promise<any[]> => {
        try {
            const { group_user: guModel } = await import('../Models/GroupUser');
            const membership = await guModel.findOne({
                where: { id_userA: userId, id_group: groupId, status: 'active' }
            });
            if (!membership) {
                throw new Error('NOT_A_MEMBER');
            }

            const activeMembers = await guModel.findAll({
                where: { id_group: groupId, status: 'active' }
            });

            const userIds = activeMembers.map((m: any) => m.id_userA);
            if (userIds.length === 0) {
                return [];
            }

            let users = await userController.selectUsersWithIdsList(userIds);

            if (searchName) {
                users = users.filter((u: any) =>
                    u.name.toLowerCase().includes(searchName.toLowerCase())
                );
            }

            return users.map((u: any) => u.toJSON());
        } catch (err) {
            throwError(err);
        }
    },

    getPendingRequests: async (adminId: string, groupId: number): Promise<any[]> => {
        try {
            const group = await groupModel.selectGroup({ id: groupId });
            if (!group || group.admin !== adminId) {
                throw new Error('NOT_GROUP_ADMIN');
            }

            const { group_user: guModel } = await import('../Models/GroupUser');
            const pendingMembers = await guModel.findAll({
                where: { id_group: groupId, status: 'pending' }
            });

            if (pendingMembers.length === 0) {
                return [];
            }

            const userIds = pendingMembers.map((m: any) => m.id_userA);
            const users = await userController.selectUsersWithIdsList(userIds);

            return users.map((u: any) => u.toJSON());
        } catch (err) {
            throwError(err);
        }
    },

    // =====================================================
    // GROUP PAGE DATA
    // =====================================================

    getGroupPageData: async (userId: string, groupId: number) => {
        const membershipStatus = await GroupController.checkMembershipStatus(userId, groupId);
        const group = await GroupController.selectGroup(groupId);
        const posts = await GroupController.getGroupPostsSorted(groupId, userId);
        const transformedPosts = transformPostServices.transformPosts(posts);

        return {
            group: group?.toJSON(),
            Posts: transformedPosts,
            isAdmin: membershipStatus.isAdmin,
            isMember: membershipStatus.status === 'active',
            isPending: membershipStatus.status === 'pending'
        };
    },

    // =====================================================
    // POST MANAGEMENT
    // =====================================================

    deletePost: async (
        userId: string,
        groupId: number,
        postId: number
    ): Promise<{ success: boolean; message?: string }> => {
        const post = await postController.selectPostById(postId);
        if (!post) {
            return { success: false, message: 'Bài viết không tồn tại' };
        }

        const membershipStatus = await GroupController.checkMembershipStatus(userId, groupId);

        if (!membershipStatus.isAdmin && post.user_id !== userId) {
            return { success: false, message: 'Không có quyền xóa bài viết' };
        }

        await postController.delPost(postId);

        if (membershipStatus.isAdmin && post.user_id !== userId) {
            const notification_value: NotificationServerTake = {
                selectedIdChatRoom: groupId,
                receiver_id: post.user_id,
                content: `Admin đã xóa bài viết ${postId} của bạn trong nhóm ${groupId}`,
                type: 'static'
            };
            const result = await addNotification(notification_value);
            if (!result.id) {
                throw new Error('Lỗi khi tạo thông báo');
            }
            sendNotification(result.id, notification_value);
        }

        return { success: true };
    },

    updatePost: async (
        userId: string,
        postId: number,
        content: string,
        scope: string,
        think: string,
        postIdOrigin?: number | null
    ): Promise<{ success: boolean; message?: string }> => {
        const post = await postController.selectPostById(postId);
        if (!post) {
            return { success: false, message: 'Bài viết không tồn tại' };
        }

        if (post.user_id !== userId) {
            return { success: false, message: 'Không có quyền sửa bài viết' };
        }

        await postController.update(post.PostId_origin as any, postId, content, scope, think);
        return { success: true };
    },

    // =====================================================
    // JOIN GROUP
    // =====================================================

    joinGroup: async (userId: string, groupId: number) => {
        const group = await GroupController.selectGroup(groupId);
        if (!group) {
            throw new Error('GROUP_NOT_FOUND');
        }
        if (!group.admin) {
            throw new Error('INVALID_GROUP_RECORD');
        }

        await GroupController.joinGroupRequest(
            userId,
            groupId,
            {
                selectedIdChatRoom: groupId,
                receiver_id: group.admin,
                content: `Có yêu cầu tham gia nhóm mới`,
                type: 'static'
            }
        );

        return { success: true };
    }
};
