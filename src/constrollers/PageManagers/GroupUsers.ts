import { sequelize } from '../../Configs/Sql';
import { group_user, methods as groupUserModel } from '../../Models/GroupUser';
import { methods as groupModel, Group } from '../../Models/Group';
import throwError from '../../Helpers/ThrowErrorOfController';
import { addNotification, sendNotification } from '../../Services/FollowerService';
import NotificationServerTake from '../../Types/Notification';
import { methods as userController } from '../User'

export let methods = {
    // Lấy danh sách nhóm đã tham gia
    selectGroupsJoined: async (userId: string): Promise<any[]> => {
        try {
            const joinedGroupUsers = await groupUserModel.selectGroupsJoined(userId);
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

    // Lấy danh sách nhóm đang chờ duyệt
    selectGroupsPending: async (userId: string): Promise<any[]> => {
        try {
            const pendingGroupUsers = await groupUserModel.selectGroupsPending(userId);
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

    // Tạo nhóm mới
    createGroup: async (
        adminId: string,
        name: string,
        hastag?: string
    ): Promise<void> => {
        const transaction = await sequelize.transaction();
        try {
            // Kiểm tra tên nhóm đã tồn tại chưa
            const existingGroup = await groupModel.selectGroup({ name });
            if (existingGroup) {
                throw new Error('GROUP_NAME_EXISTS');
            }

            // Tạo nhóm
            const newGroup = await groupModel.createGroup(
                { name, hastag, admin: adminId },
                transaction
            );

            // Tự động thêm admin vào nhóm với status 'active'
            await groupUserModel.addMember(
                adminId,
                newGroup.id,
                'active',
                transaction
            );

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            console.error('Error in createGroup controller:', error);
            throw error;
        }
    },

    // Gửi yêu cầu tham gia nhóm
    joinGroupRequest: async (
        userId: string,
        groupId: number,
        notification_value: NotificationServerTake
    ): Promise<void> => {
        const transaction = await sequelize.transaction();
        try {
            // Kiểm tra nhóm có tồn tại không
            const group = await groupModel.selectGroup({ id: groupId });
            if (!group) {
                throw new Error('GROUP_NOT_FOUND');
            }

            // Kiểm tra đã là thành viên hoặc đã gửi yêu cầu chưa
            const existingMember = await groupUserModel.checkMembership(userId, groupId);
            if (existingMember) {
                throw new Error('ALREADY_MEMBER');
            }

            // Thêm yêu cầu với status 'pending'
            await groupUserModel.addMember(userId, groupId, 'pending', transaction);

            // Tạo thông báo cho admin nhóm
            const notificationResult = await addNotification(
                notification_value,
                transaction
            );

            await transaction.commit();

            sendNotification(
                notificationResult.id,
                notification_value
            );
        } catch (error) {
            await transaction.rollback();
            console.error('Error in joinGroupRequest controller:', error);
            throw error;
        }
    },

    // Chấp nhận yêu cầu tham gia (chỉ admin)
    acceptJoinRequest: async (
        adminId: string,
        groupId: number,
        userId: string,
        notification_value: NotificationServerTake
    ): Promise<void> => {
        const transaction = await sequelize.transaction();
        try {
            // Kiểm tra người thực hiện có phải admin của nhóm không
            const group = await groupModel.selectGroup({ id: groupId });
            if (!group || group.admin !== adminId) {
                throw new Error('NOT_GROUP_ADMIN');
            }
            console.log("userId", userId)
            console.log("groupId", groupId)
            // Cập nhật status từ pending -> active
            const affectedRows = await groupUserModel.updateMemberStatus(
                userId,
                groupId,
                'active',
                transaction
            );

            if (affectedRows === 0) {
                throw new Error('REQUEST_NOT_FOUND');
            }

            // Tạo thông báo cho user
            const notificationResult = await addNotification(
                notification_value,
                transaction
            );

            await transaction.commit();

            sendNotification(
                notificationResult.id,
                notification_value
            );
        } catch (error) {
            await transaction.rollback();
            console.error('Error in acceptJoinRequest controller:', error);
            throw error;
        }
    },

    // Từ chối yêu cầu (admin) hoặc hủy yêu cầu (user)
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

            // Kiểm tra quyền: phải là admin hoặc chính user đó
            const isAdmin = group.admin === currentUserId;
            const isSelf = currentUserId === targetUserId;

            if (!isAdmin && !isSelf) {
                throw new Error('UNAUTHORIZED');
            }
            // Xóa yêu cầu pending
            const deletedCount = await groupUserModel.deleteMember(
                targetUserId,
                groupId,
                'pending',
                transaction
            );
            if (deletedCount === 0) {
                throw new Error('REQUEST_NOT_FOUND');
            }
            if (isSelf) {
                await transaction.commit();
                return;
            }
            if (isAdmin) notification_value.content = `Yêu cầu tham gia nhóm ${groupId} đã bị từ chối`;
            // Tạo thông báo
            const notificationResult = await addNotification(
                notification_value,
                transaction
            );

            await transaction.commit();

            sendNotification(
                notificationResult.id,
                notification_value
            );
        } catch (error) {
            await transaction.rollback();
            console.error('Error in rejectJoinRequest controller:', error);
            throw error;
        }
    },

    // Rời nhóm
    leaveGroup: async (
        userId: string,
        groupId: number
    ): Promise<void> => {
        const transaction = await sequelize.transaction();
        try {
            // Kiểm tra có phải admin không
            const group = await groupModel.selectGroup({ id: groupId });
            if (!group) {
                throw new Error('GROUP_NOT_FOUND');
            }

            if (group.admin === userId) {
                throw new Error('CANNOT_LEAVE_AS_ADMIN');
            }

            // Xóa khỏi nhóm (chỉ xóa nếu status = 'active')
            const deletedCount = await groupUserModel.deleteMember(
                userId,
                groupId,
                'active',
                transaction
            );

            if (deletedCount === 0) {
                throw new Error('NOT_A_MEMBER');
            }

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            console.error('Error in leaveGroup controller:', error);
            throw error;
        }
    },

    // Kiểm tra trạng thái thành viên
    checkMembershipStatus: async (
        userId: string,
        groupId: number
    ): Promise<{ exists: boolean; status?: string; isAdmin?: boolean }> => {
        try {
            const membership = await groupUserModel.checkMembership(userId, groupId);

            if (!membership) {
                return { exists: false };
            }

            // Kiểm tra có phải admin không
            const group = await groupModel.selectGroup({ id: groupId });
            const isAdmin = group?.admin === userId;

            return {
                exists: true,
                status: membership.status,
                isAdmin
            };
        } catch (error) {
            console.error('Error in checkMembershipStatus controller:', error);
            throw error;
        }
    },

    // Xóa thành viên (chỉ admin)
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

            const deletedCount = await groupUserModel.deleteMember(
                targetUserId,
                groupId,
                'active',
                transaction
            );

            if (deletedCount === 0) {
                throw new Error('NOT_A_MEMBER');
            }

            const notificationResult = await addNotification(
                notification_value,
                transaction
            );

            await transaction.commit();

            sendNotification(
                notificationResult.id,
                notification_value
            );
        } catch (error) {
            await transaction.rollback();
            console.error('Error in removeMember controller:', error);
            throw error;
        }
    },




    // Lấy danh sách thành viên
    getGroupMembers: async (
        userId: string,
        groupId: number,
        searchName?: string
    ): Promise<any[]> => {
        try {
            const membership = await groupUserModel.checkMembership(userId, groupId);
            if (!membership || membership.status !== 'active') {
                throw new Error('NOT_A_MEMBER');
            }

            const activeMembers = await groupUserModel.getGroupMembersByGroupId(
                groupId,
                'active'
            );

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

    //lấy danh sách thành viên yêu cầu tham gia
    getPendingRequests: async (adminId: string, groupId: number): Promise<group_user[]> => {
        try {
            const group = await groupModel.selectGroup({ id: groupId });
            if (!group || group.admin !== adminId) {
                throw new Error('NOT_GROUP_ADMIN');
            }
            return await groupUserModel.selectUsersPending(groupId)

        } catch (err) {
            throwError(err);
        }
    }
};