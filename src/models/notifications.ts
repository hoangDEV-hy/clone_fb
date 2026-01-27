import { sequelize } from "../configs/sql";
import { DataTypes, Model } from "sequelize";
import { Transaction } from 'sequelize';

import NotificationServerTake from "../types/Type_Notification";
import throwError from "../helpers/ThrowErrorOfSqlQuery";
export class notifications extends Model {
    declare id: number;
    declare sender_id: string;
    declare receiver_id: string;
    declare content: string
    declare type: string;
}

notifications.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    sender_id: {
        type: DataTypes.STRING,
        allowNull: false
    },
    receiver_id: {
        type: DataTypes.STRING,
        allowNull: false
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    content: {
        type: DataTypes.STRING
    }
}, {
    sequelize,
    updatedAt: true,
    createdAt: true
})
export let methods = {
    create: async (
        payload: NotificationServerTake,
        options?: { transaction?: Transaction }
    ): Promise<notifications> => {
        try {
            return await notifications.create(
                {
                    sender_id:
                        payload.selectedIdChatRoom ?? payload.selectedSenderId,
                    receiver_id: payload.receiver_id,
                    content: payload.content,
                    type: payload.type
                },
                {
                    transaction: options?.transaction
                }
            );
        } catch (err) {
            console.error('Error in notifications.create():', err);
            throw err;
        }
    },
    delete: async (notificationId: number): Promise<any> => {
        try {

            return await notifications.destroy({
                where: { id: notificationId }
            });
        } catch (err) {
            console.error('Error in notifications.delete():', err);
            throw err;
        }
    },
    selectNotificationsAndQuantity: async (
        userId: string,
        PAGE_SIZE: number,
        offset: number
    ): Promise<{ list: notifications[]; unreadCount: number }> => {

        try {

            const [list, unreadCount] = await Promise.all([
                notifications.findAll({
                    where: { receiver_id: userId },
                    order: [['createdAt', 'DESC']],
                    limit: PAGE_SIZE,
                    offset
                }),
                notifications.count({
                    where: {
                        receiver_id: userId,
                    }
                })
            ]);

            return {
                list,
                unreadCount
            };
        } catch (error) {
            console.error('Error in notifications.selectNotificationsAndQuantity():', error);
            throw error;
        }
    },
    getNotificationsChat: async (chatId: number, receiverId: string): Promise<notifications[] | null> => {
        try {
            return await notifications.findAll({
                where: {
                    receiver_id: receiverId,
                    chat_id: chatId
                },
                order: [['createdAt', 'DESC']],
                limit: 5
            });
        } catch (err) {
            throwError(err);
        }
    }
}