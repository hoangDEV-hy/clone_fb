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
        type: DataTypes.TEXT,
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

