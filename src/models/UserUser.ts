import { sequelize } from "../Configs/Sql";
import { DataTypes, Model, Op, Transaction } from "sequelize";
import { Request, Response } from "express";


class user_user extends Model {
    declare id: number;
    declare id_userA: string;
    declare id_userB: string;
    declare status: string;

}

user_user.init({
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    id_userA: {
        type: DataTypes.STRING,
        allowNull: false
    },
    id_userB: {
        type: DataTypes.STRING,
        allowNull: false
    },
    status: {
        type: DataTypes.STRING,
    },
}, {
    sequelize,
    tableName: 'users_users',
    modelName: 'user_user',
    timestamps: true
})
import { User } from "./user";
import { Posts } from "./Post";
import throwError from "../Helpers/ThrowErrorOfSqlQuery";
export { user_user };
user_user.belongsTo(User, { foreignKey: 'id_userA', as: 'userA' })
user_user.belongsTo(User, { foreignKey: 'id_userB', as: 'userB' })
user_user.hasMany(Posts, {
    foreignKey: 'user_id', // cột bất kỳ trong Posts, Sequelize không thực sự kiểm tra ở DB
    as: 'Posts'
});



export let methods = {
    add: (req: Request, res: Response): void => {
        const { id_userA, id_userB } = req.body;
        user_user.create({ id_userA, id_userB, status: 'pendding' });
    },
    up: (req: Request, res: Response): void => {
        const id = req.body;
        user_user.update({ status: 'done' }, {
            where: id
        })
    },
    del: async (data: Partial<user_user>): Promise<number> => {
        try {
            return await user_user.destroy({ where: data });
        } catch (err) {
            throwError(err);
        }
    },
    selectFriends: async (data: Partial<user_user>): Promise<user_user[]> => {
        try {

            return user_user.findAll(
                {
                    where: data
                }
            );
        } catch (err) {
            throwError(err);
        }
    },
    selectFriendsDone: async (userId: string) => {
        try {
            return await user_user.findAll({
                where: {
                    [Op.or]: [
                        { id_userA: userId, status: 'done' },
                        { id_userB: userId, status: 'done' }
                    ]
                },
                attributes: ['id_userA', 'id_userB']
            });
        } catch (err) {
            throwError(err);
        }
    },
    selectFriendsRequest: async (userId: string) => {
        try {
            return await user_user.findAll({
                where: {
                    [Op.or]: [
                        { id_userA: userId, status: 'pending' },
                        { id_userB: userId, status: 'pending' }
                    ]
                },
                attributes: ['id_userA', 'id_userB']
            });
        } catch (err) {
            throwError(err);
        }
    },
    // Gửi lời mời kết bạn
    sendFriendRequest: async (
        id_userA: string,
        id_userB: string,
        transaction?: Transaction
    ): Promise<user_user> => {
        return await user_user.create(
            {
                id_userA,
                id_userB,
                status: 'pending'
            },
            { transaction }
        );
    },

    // Chấp nhận lời mời kết bạn
    acceptFriendRequest: async (
        id_userA: string,
        id_userB: string,
        transaction?: Transaction
    ): Promise<number> => {
        const [affectedRows] = await user_user.update(
            { status: 'done' },
            {
                where: {
                    [Op.or]: [
                        { id_userA, id_userB, status: 'pending' },
                        { id_userA: id_userB, id_userB: id_userA, status: 'pending' }
                    ]
                },
                transaction
            }
        );

        return affectedRows;
    },

    // Xóa bạn bè hoặc từ chối lời mời
    deleteFriendRequest: async (
        id_userA: string,
        id_userB: string,
        transaction?: Transaction
    ): Promise<number> => {
        return await user_user.destroy({
            where: {
                [Op.or]: [
                    { id_userA, id_userB },
                    { id_userA: id_userB, id_userB: id_userA }
                ]
            },
            transaction
        });
    },
    checkFriendship: async (
        userA: string,
        userB: string
    ): Promise<user_user | null> => {
        return await user_user.findOne({
            where: {
                [Op.or]: [
                    { id_userA: userA, id_userB: userB },
                    { id_userA: userB, id_userB: userA }
                ]
            }
        });
    },
}
