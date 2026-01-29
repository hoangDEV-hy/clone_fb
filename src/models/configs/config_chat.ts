import { sequelize } from '../../configs/sql';
import { DataTypes, Model, Transaction } from 'sequelize';
import throwError from '../../helpers/ThrowErrorOfSqlQuery';

class config_chat extends Model {
    declare id: number;
    declare chat_id: number;
    declare author: string;
    declare nickName: string;
    declare theme: string;
    declare notifications: boolean;
    declare createdAt: Date;
    declare updatedAt: Date;
}

config_chat.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        chat_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        author: {
            type: DataTypes.STRING,
            allowNull: false
        },
        nickName: {
            type: DataTypes.STRING,
            allowNull: true
        },
        theme: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: 'default'
        },
        notifications: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        }
    },
    {
        sequelize,
        modelName: 'ConfigChat',
        tableName: 'config_chats',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['chat_id', 'author']
            }
        ]
    }
);

export { config_chat };

export const methods = {
    /**
     * Tạo config mới
     */
    createConfig: async (
        data: Partial<config_chat>,
        transaction?: Transaction
    ): Promise<config_chat | null> => {
        try {
            return await config_chat.create(data as any, { transaction });
        } catch (error) {
            console.error('Lỗi khi tạo config:', error);
            throwError(error);
            return null;
        }
    },

    /**
     * Cập nhật config
     */
    updateConfig: async (
        dataEdit: Partial<config_chat>,
        dataWhere: Partial<config_chat>,
        transaction?: Transaction
    ): Promise<number> => {
        try {
            const [result] = await config_chat.update(dataEdit, {
                where: dataWhere,
                transaction
            });
            return result;
        } catch (error) {
            console.error('Lỗi khi cập nhật config:', error);
            throwError(error);
            return 0;
        }
    },

    /**
     * Lấy config của user trong chat
     */
    getConfig: async (
        chatId: number,
        userId: string
    ): Promise<config_chat | null> => {
        try {
            return await config_chat.findOne({
                where: {
                    chat_id: chatId,
                    author: userId
                },
                order: []
            });
        } catch (error) {
            throwError(error);
            return null;
        }
    },

    /**
     * Tạo config mặc định cho user mới
     */
    createDefaultConfig: async (
        chatId: number,
        userId: string,
        transaction?: Transaction
    ): Promise<config_chat | null> => {
        try {
            return await config_chat.create(
                {
                    chat_id: chatId,
                    author: userId,
                    notifications: true,
                    theme: 'default'
                } as any,
                { transaction }
            );
        } catch (error) {
            throwError(error);
            return null;
        }
    },

    /**
     * Xóa config
     */
    deleteConfig: async (
        chatId: number,
        userId: string,
        transaction?: Transaction
    ): Promise<number> => {
        try {
            return await config_chat.destroy({
                where: {
                    chat_id: chatId,
                    author: userId
                },
                transaction
            });
        } catch (error) {
            throwError(error);
            return 0;
        }
    },

    /**
     * Cập nhật nickname
     */
    updateNickname: async (
        chatId: number,
        userId: string,
        nickname: string,
        transaction?: Transaction
    ): Promise<number> => {
        try {
            const [result] = await config_chat.update(
                { nickName: nickname },
                {
                    where: {
                        chat_id: chatId,
                        author: userId
                    },
                    transaction
                }
            );
            return result;
        } catch (error) {
            throwError(error);
            return 0;
        }
    },

    /**
     * Bật/tắt thông báo
     */
    toggleNotifications: async (
        chatId: number,
        userId: string,
        enabled: boolean,
        transaction?: Transaction
    ): Promise<number> => {
        try {
            const [result] = await config_chat.update(
                { notifications: enabled },
                {
                    where: {
                        chat_id: chatId,
                        author: userId
                    },
                    transaction
                }
            );
            return result;
        } catch (error) {
            throwError(error);
            return 0;
        }
    }
};