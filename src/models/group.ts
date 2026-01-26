import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../configs/sql'; // adjust the path
import { Transaction, Op } from 'sequelize';

class Group extends Model {
    public id!: number;
    public name?: string;
    public hastag?: string;
    public admin?: string;
}

Group.init({
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        unique: true,
    },
    hastag: {
        type: DataTypes.STRING,
    },
    admin: {
        type: DataTypes.STRING,
    },
},
    {

        sequelize,
        modelName: 'Group',
        timestamps: false,
        tableName: 'groups'
    }
);
import { group_user } from './group_user';
Group.hasMany(group_user, { foreignKey: 'id_group', as: 'groups' });
export { Group };



import { Request, Response } from 'express';
import throwError from '../helpers/ThrowErrorOfSqlQuery';
import { User } from './user';

async function check(req: Request, res: Response): Promise<any> {
    const { name } = req.body;
    if (await Group.findOne({ where: { name: name } })) {
        return res.status(400).json({ message: 'Name already registered' });
    };
}
export let methods = {
    // Tạo nhóm mới
    createGroup: async (
        data: { name: string; hastag?: string; admin: string },
        transaction?: Transaction
    ): Promise<Group> => {
        try {
            return await Group.create(data, { transaction });
        } catch (err) {
            throwError(err);
        }
    },

    // Cập nhật thông tin nhóm
    updateGroup: async (
        id: number,
        data: Partial<Group>,
        transaction?: Transaction
    ): Promise<number> => {
        try {
            const [affectedRows] = await Group.update(data, {
                where: { id },
                transaction
            });
            return affectedRows;
        } catch (err) {
            throwError(err);
        }
    },

    // Xóa nhóm
    deleteGroup: async (
        id: number,
        transaction?: Transaction
    ): Promise<number> => {
        try {
            return await Group.destroy({
                where: { id },
                transaction
            });
        } catch (err) {
            throwError(err);
        }
    },

    // Tìm một nhóm
    selectGroup: async (data: Partial<Group>): Promise<Group | null> => {
        try {
            return await Group.findOne({ where: data });
        } catch (err) {
            throwError(err);
        }
    },

    // Tìm nhiều nhóm
    selectGroups: async (data: Partial<Group>): Promise<Group[]> => {
        try {
            return await Group.findAll({ where: data });
        } catch (err) {
            throwError(err);
        }
    },

    // Lấy nhóm kèm theo danh sách thành viên
    selectGroupsGroupuserByOp_in: async (idGroups: number[]): Promise<Group[]> => {
        try {
            return await Group.findAll({
                where: {
                    id: { [Op.in]: idGroups }
                },
                include: [{
                    model: group_user,
                    as: 'groups',
                    required: false
                }]
            });
        } catch (err) {
            throwError(err);
        }
    },
    getIdAdmin: async (groupId: number): Promise<string | undefined> => {
        const user = await Group.findOne({
            where: {
                id: groupId
            },
            attributes: ['admin']
        })
        return user?.admin
    }
};