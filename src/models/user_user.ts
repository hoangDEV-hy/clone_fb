import { sequelize } from "../configs/sql";
import { DataTypes, Model } from "sequelize";
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
import { Posts } from "./Posts";
export { user_user };
user_user.belongsTo(User, { foreignKey: 'id_userA', as: 'userA' })
user_user.belongsTo(User, { foreignKey: 'id_userB', as: 'userB' })
user_user.belongsTo(User, { foreignKey: 'id_userA' })
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
    del: (req: Request, res: Response): void => {
        const id = req.body;
        user_user.destroy({ where: id });
    },
    select: async (key: { [id: string]: string }): Promise<user_user[]> => {
        return user_user.findAll(
            {
                where: key
            }
        );
    }
}
