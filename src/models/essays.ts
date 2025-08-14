import { sequelize } from '../configs/sql'
import { DataTypes, Model } from 'sequelize'

class Essays extends Model {
    declare id: number;
    declare group_id: number;
    declare user_id: string;
    declare contens: string;
    declare scope: string;
}

Essays.init({
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    group_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    contens: {
        type: DataTypes.TEXT
    },
    scope: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'only_me'
    }
}, {
    sequelize,
    timestamps: true
});
import { User } from './user';
import { Group } from './group';
import { user_user } from './user_user';
import { group_user } from './group_user';
Essays.belongsTo(User, { as: 'users', foreignKey: 'user_id' })
Essays.belongsTo(Group, { as: 'groups', foreignKey: 'group_id' })
user_user.hasMany(Essays, {
    foreignKey: 'user_id', // cột bất kỳ trong Essays, Sequelize không thực sự kiểm tra ở DB
    as: 'essays'
});
group_user.hasMany(Essays, {
    foreignKey: 'user_id', // cột bất kỳ trong Essays, Sequelize không thực sự kiểm tra ở DB
    as: 'essays'
});

export { Essays }
import { Response } from 'express';

export let methods = {
    create: async (value: { [key: string]: string }) => {
        return await Essays.create(value);
    },
    select: async (value: { [key: string]: any }) => {
        return await Essays.findAll({ where: value });
    },
    des: async (value: { [key: string]: any }) => {
        return await Essays.destroy({ where: value });
    },
    up: async (value: { [key: string]: any }, conditions: { [key: string]: any }) => {
        return await Essays.update(value, { where: conditions });
    }
}

