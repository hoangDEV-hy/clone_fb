import { notifications } from "../Models/Notifications";

import { sequelize } from '../Configs/Sql'; // chỉnh path
import { methods as followerMethods } from '../Models/Follower';
import { addNotification, sendNotification } from '../Services/FollowerService';

import NotificationServerTake from '../Types/Notification';

const FollowerController = {
    selectDanhSach: async (
        selectedFollowerID: string,
        page: number
    ) => {
        try {
            return await followerMethods.selectDanhSach(
                selectedFollowerID,
                page
            );
        } catch (error) {
            console.error('Error in selectDanhSach controller:', error);
            throw error;
        }
    },

    addFollowers: async (
        additionedFollowingsID: string[],
        selectedFollowerID: string,
        notification_value: NotificationServerTake
    ): Promise<void> => {
        const transaction = await sequelize.transaction();
        try {
            await followerMethods.addFollowers(
                additionedFollowingsID,
                selectedFollowerID,
                transaction
            );

            const notificationResult =
                await addNotification(
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
            console.error('Error in addFollowers controller:', error);
            throw error;
        }
    },

    deleteFollowers: async (
        deletedFollowingsID: string[],
        selectedFollowerID: string,
        notification_value: NotificationServerTake
    ): Promise<void> => {
        const transaction = await sequelize.transaction();

        try {
            await followerMethods.deleteFollowers(
                deletedFollowingsID,
                selectedFollowerID,
                transaction
            );

            const notificationResult =
                await addNotification(
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
            console.error('Error in deleteFollowers controller:', error);
            throw error;
        }
    },
    checkFollowing: async (
        follower: string,
        following: string
    ): Promise<boolean> => {
        if (!follower || !following) {
            throw new Error('follower và following là bắt buộc');
        }

        try {
            const result = await followerMethods.selectFollowing(follower, following);
            return result !== null;
        } catch (error) {
            console.error('checkFollowing error:', error);
            throw error;
        }
    }
};

export default FollowerController;
