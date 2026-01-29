import { sequelize } from '../../Configs/Sql';
import { methods as friendModel, user_user } from '../../Models/UserUser';
import throwError from '../../Helpers/ThrowErrorOfController';
import { methods as userController } from '../User'
import { addNotification, sendNotification } from '../../Services/FollowerService';


import NotificationServerTake from '../../Types/Notification';

export let methods = {
    accepRequest: friendModel.up,
    sendRequest: friendModel.add,
    delRequest: friendModel.del,
    selectFriendsDone: async (id: string): Promise<user_user[]> => {
        try {
            const selectedFriended = await friendModel.selectFriendsDone(id);
            const friendIds = selectedFriended.map(
                (f: any) => f.id_userA === id ? f.id_userB : f.id_userA
            );

            const listFriends = await userController.selectUsersWithIdsList(friendIds);

            return listFriends.map((g: any) => g.toJSON());
        } catch (err) {
            throwError(err);
        }
    },
    selectFriendsRequest: async (id: string): Promise<user_user[]> => {
        try {
            const selectedFriended = await friendModel.selectFriendsRequest(id);
            const idfriends = selectedFriended.map((g: any) => g.id_userA);

            const listFriends = await userController.selectUsersWithIdsList(idfriends);

            return listFriends.map((g: any) => g.toJSON());
        } catch (err) {
            throwError(err);
        }
    },
    delFriend: async (idUserA: string, idUserB: string): Promise<number> => {
        try {
            return await friendModel.del({ id_userA: idUserA, id_userB: idUserB, status: 'done' });
        } catch (err) {
            throwError(err);
        }
    },
    deleteFriendRequest: async (
        id_userA: string,
        id_userB: string,
        notification_value: NotificationServerTake
    ): Promise<void> => {
        const transaction = await sequelize.transaction();
        try {
            const deletedCount = await friendModel.deleteFriendRequest(
                id_userA,
                id_userB,
                transaction
            );

            if (deletedCount === 0) {
                throw new Error('FRIENDSHIP_NOT_FOUND');
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
            console.error('Error in deleteFriend controller:', error);
            throw error;
        }
    },
    acceptFriendRequest: async (
        id_userA: string,
        id_userB: string,
        notification_value: NotificationServerTake
    ): Promise<void> => {
        const transaction = await sequelize.transaction();
        try {
            const affectedRows = await friendModel.acceptFriendRequest(
                id_userA,
                id_userB,
                transaction
            );

            if (affectedRows === 0) {
                throw new Error('FRIEND_REQUEST_NOT_FOUND');
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
            console.error('Error in acceptFriendRequest controller:', error);
            throw error;
        }
    },
    sendFriendRequest: async (
        id_userA: string,
        id_userB: string,
        notification_value: NotificationServerTake
    ): Promise<void> => {
        const transaction = await sequelize.transaction();
        try {
            await friendModel.sendFriendRequest(
                id_userA,
                id_userB,
                transaction
            );

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
            console.error('Error in sendFriendRequest controller:', error);
            throw error;
        }
    },
    checkFriendship: async (
        userA: string,
        userB: string
    ): Promise<{ exists: boolean; status?: string }> => {
        try {
            const friendship = await friendModel.checkFriendship(userA, userB);

            if (!friendship) {
                return { exists: false };
            }

            return {
                exists: true,
                status: friendship.status
            };
        } catch (error) {
            console.error('Error in checkFriendship controller:', error);
            throw error;
        }
    }
}