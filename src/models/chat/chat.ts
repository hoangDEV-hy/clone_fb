import { sequelize } from '../../configs/sql'
import { Model, DataTypes, Op, Transaction } from "sequelize";

class chat extends Model {
    declare id: number;
    declare sender_id: string;
    declare receiver_id: string;
    declare admin: string;
    declare name: string;
    declare type: string;
}
chat.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
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
        admin: {
            type: DataTypes.STRING
        },
        name: {
            type: DataTypes.STRING
        },
        type: {
            type: DataTypes.STRING
        }
    },

    {
        sequelize,
        modelName: 'Chat'
    }
)
import { contentsChat } from './contensChat';
import throwError from '../../helpers/ThrowErrorOfSqlQuery';
chat.hasMany(contentsChat, { foreignKey: 'chatID', as: 'contensChat' })
export { chat }

export const methods = {
    /**
     * Tìm chat giữa 2 người
     */
    selectChatBySenderAndReceiver: async (
        selectedSenderId: string,
        selectedReceiverId: string
    ): Promise<chat | null> => {
        try {
            return await chat.findOne({
                where: {
                    [Op.or]: [
                        { sender_id: selectedSenderId, receiver_id: selectedReceiverId },
                        { sender_id: selectedReceiverId, receiver_id: selectedSenderId }
                    ]
                },
                include: [
                    {
                        model: contentsChat,
                        as: 'contensChat',
                        required: false,
                        limit: 50,
                        order: [['createdAt', 'DESC']]
                    }
                ]
            });
        } catch (err) {
            throwError(err);
            return null;
        }
    },

    /**
     * Tạo chat mới
     */
    createChat: async (
        data: Partial<chat>,
        transaction?: Transaction
    ): Promise<chat | null> => {
        try {
            return await chat.create(data as any, { transaction });
        } catch (err) {
            throwError(err);
            return null;
        }
    },

    /**
     * Cập nhật thông tin chat
     */
    updateChat: async (
        data: Partial<chat>,
        condition: Partial<chat>,
        transaction?: Transaction
    ): Promise<number> => {
        try {
            const [result] = await chat.update(data, {
                where: condition,
                transaction
            });
            return result;
        } catch (err) {
            throwError(err);
            return 0;
        }
    },

    /**
     * Lấy chi tiết chat theo ID
     */
    selectChatById: async (chatId: number): Promise<chat | null> => {
        try {
            return await chat.findByPk(chatId, {
                include: [
                    {
                        model: contentsChat,
                        as: 'contensChat',
                        required: false,
                        limit: 50,
                        order: [['createdAt', 'DESC']]
                    }
                ]
            });
        } catch (err) {
            throwError(err);
            return null;
        }
    },

    /**
     * Kiểm tra số lượng thành viên để xác định type
     */
    checkAndUpdateChatType: async (
        chatId: number,
        transaction?: Transaction
    ): Promise<string> => {
        try {
            const { chat_member } = require('./chat_members');
            const memberCount = await chat_member.count({
                where: { chat_id: chatId },
                transaction
            });

            const newType = memberCount === 2 ? 'chat' : 'group';

            await chat.update(
                { type: newType },
                { where: { id: chatId }, transaction }
            );

            return newType;
        } catch (err) {
            throwError(err);
            return 'chat';
        }
    },

    /**
     * Lấy danh sách chat của user
     */
    selectUserChats: async (userId: string): Promise<chat[]> => {
        try {
            const { chat_member } = require('./chat_members');

            const userChatMembers = await chat_member.findAll({
                where: { idUser: userId },
                attributes: ['chat_id']
            });

            const chatIds = userChatMembers.map((m: any) => m.chat_id);

            return await chat.findAll({
                where: { id: { [Op.in]: chatIds } },
                include: [
                    {
                        model: contentsChat,
                        as: 'contensChat',
                        required: false,
                        limit: 1,
                        order: [['createdAt', 'DESC']]
                    }
                ],
                order: [['updatedAt', 'DESC']]
            });
        } catch (err) {
            throwError(err);
            return [];
        }
    },

    /**
     * Xóa chat
     */
    deleteChat: async (
        chatId: number,
        transaction?: Transaction
    ): Promise<number> => {
        try {
            return await chat.destroy({
                where: { id: chatId },
                transaction
            });
        } catch (err) {
            throwError(err);
            return 0;
        }
    }
};