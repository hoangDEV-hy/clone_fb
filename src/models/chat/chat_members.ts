import { sequelize } from "../../configs/sql";
import { Model, DataTypes, Transaction } from "sequelize";
import throwError from "../../helpers/ThrowErrorOfSqlQuery";

class chat_member extends Model {
    declare id: number;
    declare chat_id: number;
    declare idUser: string;
    declare role: 'admin' | 'guest';
    declare status: 'joining' | 'pending' | 'left';
    declare createdAt: Date;
    declare updatedAt: Date;
}

chat_member.init(
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
        idUser: {
            type: DataTypes.STRING,
            allowNull: false
        },
        role: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'guest'
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'joining'
        }
    },
    {
        sequelize,
        modelName: 'ChatMember',
        tableName: 'chat_members',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['chat_id', 'idUser']
            }
        ]
    }
);

import { User } from "../user";
// for selecting user information
chat_member.belongsTo(User, {
    foreignKey: 'idUser', as: 'users'
})
export { chat_member }
export const methods = {
    /**
     * Lấy danh sách thành viên theo điều kiện
     */
    selectMembers: async (
        data: Partial<chat_member>,
        includeUser: boolean = false
    ): Promise<chat_member[]> => {
        try {
            const options: any = {
                where: data
            };

            if (includeUser) {
                options.include = [
                    {
                        model: User,
                        as: 'users',
                        attributes: ['id', 'name', 'avatar']
                    }
                ];
            }

            return await chat_member.findAll(options);
        } catch (err) {
            throwError(err);
            return [];
        }
    },

    /**
     * Tạo 1 thành viên
     */
    create: async (
        key: Partial<chat_member>,
        transaction?: Transaction
    ): Promise<chat_member | null> => {
        try {
            return await chat_member.create(key as any, { transaction });
        } catch (err) {
            throwError(err);
            return null;
        }
    },

    /**
     * Tạo nhiều thành viên
     */
    creates: async (
        chat_valueMembers: Array<Partial<chat_member>>,
        transaction?: Transaction
    ): Promise<chat_member[]> => {
        try {
            return await chat_member.bulkCreate(
                chat_valueMembers as any[],
                { transaction }
            );
        } catch (err) {
            throwError(err);
            return [];
        }
    },

    /**
     * Xóa thành viên khỏi chat
     */
    remove: async (
        selectedIdChatRoom: number,
        receiver_id: string,
        transaction?: Transaction
    ): Promise<number> => {
        try {
            return await chat_member.destroy({
                where: {
                    chat_id: selectedIdChatRoom,
                    idUser: receiver_id
                },
                transaction
            });
        } catch (err) {
            throwError(err);
            return 0;
        }
    },

    /**
     * Cập nhật thông tin thành viên
     */
    update: async (
        chat_memberValue: {
            selectedIdChatRoom: number;
            receiver_id: string;
            status?: string;
            role?: string;
        },
        transaction?: Transaction
    ): Promise<number> => {
        try {
            const updateData: any = {};
            if (chat_memberValue.status) updateData.status = chat_memberValue.status;
            if (chat_memberValue.role) updateData.role = chat_memberValue.role;

            const [result] = await chat_member.update(updateData, {
                where: {
                    chat_id: chat_memberValue.selectedIdChatRoom,
                    idUser: chat_memberValue.receiver_id
                },
                transaction
            });
            return result;
        } catch (err) {
            throwError(err);
            return 0;
        }
    },

    /**
     * Kiểm tra xem user có phải admin không
     */
    isAdmin: async (chatId: number, userId: string): Promise<boolean> => {
        try {
            const member = await chat_member.findOne({
                where: {
                    chat_id: chatId,
                    idUser: userId,
                    role: 'admin'
                }
            });
            return member !== null;
        } catch (err) {
            throwError(err);
            return false;
        }
    },

    /**
     * Đếm số lượng thành viên
     */
    countMembers: async (chatId: number, transaction?: Transaction): Promise<number> => {
        try {
            return await chat_member.count({
                where: { chat_id: chatId, status: 'joining' },
                transaction
            });
        } catch (err) {
            throwError(err);
            return 0;
        }
    },

    /**
     * Chuyển quyền admin
     */
    transferAdmin: async (
        chatId: number,
        oldAdminId: string,
        newAdminId: string,
        transaction?: Transaction
    ): Promise<boolean> => {
        try {
            // Hạ quyền admin cũ
            await chat_member.update(
                { role: 'guest' },
                {
                    where: { chat_id: chatId, idUser: oldAdminId },
                    transaction
                }
            );

            // Nâng quyền admin mới
            await chat_member.update(
                { role: 'admin' },
                {
                    where: { chat_id: chatId, idUser: newAdminId },
                    transaction
                }
            );

            return true;
        } catch (err) {
            throwError(err);
            return false;
        }
    },

    /**
     * Lấy danh sách admin của chat
     */
    getAdmins: async (chatId: number): Promise<chat_member[]> => {
        try {
            return await chat_member.findAll({
                where: {
                    chat_id: chatId,
                    role: 'admin',
                    status: 'joining'
                },
                include: [
                    {
                        model: User,
                        as: 'users',
                        attributes: ['id', 'name', 'avatar']
                    }
                ]
            });
        } catch (err) {
            throwError(err);
            return [];
        }
    }
};