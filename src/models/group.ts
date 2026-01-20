import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../configs/sql'; // adjust the path

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

async function check(req: Request, res: Response): Promise<any> {
    const { name } = req.body;
    if (await Group.findOne({ where: { name: name } })) {
        return res.status(400).json({ message: 'Name already registered' });
    };
}
let methods = {

    create: async (req: Request, res: Response): Promise<any> => {

        try {
            await check(req, res);
            const { name, hastag, admin } = req.body;
            const newGroup = await Group.create({ name, hastag, admin });

            return res.status(201).json({ message: 'group created' });
        }
        catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to create group' });
        }
    },
    edit: async (req: Request, res: Response): Promise<any> => {

        try {
            await check(req, res);
            const { name, hastag, admin } = req.body;
            const newGroup = await Group.create({ name, hastag, admin });

            return res.status(201).json({ message: 'group created' });
        }
        catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to create group' });
        }
    },
    destroy: async (req: Request, res: Response): Promise<any> => {

        try {
            await check(req, res);
            const { name, hastag, admin } = req.body;
            const newGroup = await Group.create({ name, hastag, admin });

            return res.status(201).json({ message: 'group created' });
        }
        catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to create group' });
        }
    },
    selectGroup: async (data: Partial<Group>): Promise<Group | null> => {
        try {
            return await Group.findOne({ where: data });
        } catch (err) {
            throwError(err);
        }
    },
    selectGroups: async (data: Partial<Group>): Promise<Group[]> => {
        try {
            return await Group.findAll({ where: data });
        } catch (err) {
            throwError(err);
        }
    }

}
export { methods };