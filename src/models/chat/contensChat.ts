import { sequelize } from '../../configs/sql';
import { Model, DataTypes, Transaction, Op } from 'sequelize';
import throwError from '../../helpers/ThrowErrorOfSqlQuery';

class contentsChat extends Model {
    declare id: number;
    declare chatID: number;
    declare content: string;
    declare author: string;
    declare type: 'text' | 'image' | 'file' | 'system';
    declare createdAt: Date;
    declare updatedAt: Date;
}

contentsChat.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        chatID: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        author: {
            type: DataTypes.STRING,
            allowNull: false
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'text'
        }
    },
    {
        sequelize,
        modelName: 'ContensChat',
        tableName: 'contens_chats',
        timestamps: true,
        indexes: [
            {
                fields: ['chatID', 'createdAt']
            }
        ]
    }
);

export { contentsChat };

export const methods = {
    /**
     * Tạo tin nhắn mới
     */
    createMessage: async (
        messageData: Partial<contentsChat>,
        transaction?: Transaction
    ): Promise<contentsChat | null> => {
        try {
            return await contentsChat.create(messageData as any, { transaction });
        } catch (err) {
            throwError(err);
            return null;
        }
    },

    /**
     * Lấy tin nhắn theo phân trang
     */
    getMessages: async (
        chatId: number,
        page: number = 1,
        limit: number = 50
    ): Promise<contentsChat[]> => {
        try {
            return await contentsChat.findAll({
                where: { chatID: chatId },
                order: [['createdAt', 'DESC']],
                limit,
                offset: (page - 1) * limit
            });
        } catch (err) {
            throwError(err);
            return [];
        }
    },

    /**
     * Lấy 5 tin nhắn mới nhất
     */
    getLatestMessages: async (chatId: number): Promise<contentsChat[]> => {
        try {
            return await contentsChat.findAll({
                where: { chatID: chatId },
                order: [['createdAt', 'DESC']],
                limit: 5
            });
        } catch (err) {
            throwError(err);
            return [];
        }
    },

    /**
     * Xóa tin nhắn (chỉ admin hoặc chính người gửi)
     */
    deleteMessage: async (
        messageId: number,
        userId: string,
        isAdmin: boolean,
        transaction?: Transaction
    ): Promise<number> => {
        try {
            const whereCondition: any = { id: messageId };

            // Nếu không phải admin thì chỉ xóa được tin nhắn của mình
            if (!isAdmin) {
                whereCondition.author = userId;
            }

            return await contentsChat.destroy({
                where: whereCondition,
                transaction
            });
        } catch (err) {
            throwError(err);
            return 0;
        }
    },

    /**
     * Xóa tất cả tin nhắn của 1 chat
     */
    deleteAllMessages: async (
        chatId: number,
        transaction?: Transaction
    ): Promise<number> => {
        try {
            return await contentsChat.destroy({
                where: { chatID: chatId },
                transaction
            });
        } catch (err) {
            throwError(err);
            return 0;
        }
    },

    /**
     * Tìm kiếm tin nhắn trong chat
     */
    searchMessages: async (
        chatId: number,
        searchTerm: string,
        page: number = 1,
        limit: number = 20
    ): Promise<contentsChat[]> => {
        try {
            return await contentsChat.findAll({
                where: {
                    chatID: chatId,
                    content: {
                        [Op.like]: `%${searchTerm}%`
                    }
                },
                order: [['createdAt', 'DESC']],
                limit,
                offset: (page - 1) * limit
            });
        } catch (err) {
            throwError(err);
            return [];
        }
    },

    /**
     * Đếm số tin nhắn trong chat
     */
    countMessages: async (chatId: number): Promise<number> => {
        try {
            return await contentsChat.count({
                where: { chatID: chatId }
            });
        } catch (err) {
            throwError(err);
            return 0;
        }
    },

    /**
     * Lấy tin nhắn cuối cùng của chat
     */
    getLastMessage: async (chatId: number): Promise<contentsChat | null> => {
        try {
            return await contentsChat.findOne({
                where: { chatID: chatId },
                order: [['createdAt', 'DESC']]
            });
        } catch (err) {
            throwError(err);
            return null;
        }
    }
};