import { sequelize } from "../configs/sql";
import {  DataTypes, Model } from "sequelize";

class interactions extends Model {
    declare id: number;
    declare id_user: string;
    declare id_essays: number;
    declare classify: string;
    declare content: Text;
}

interactions.init({
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    id_user: {
        type: DataTypes.STRING,
        allowNull: false
    },
    id_essays: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    classify: {
        type: DataTypes.STRING,
    },
    content: {
        type: DataTypes.TEXT,
    }
}, {
    sequelize,
    tableName: 'interactions',
    modelName: 'interactions',
    timestamps: true
})
export { interactions };

export let methods = {
    create: async (value: { [key: string]: string }) => {
        return await interactions.create(value);
    },
    select: async (value: { [key: string]: any }) => {
        return await interactions.findAll({ where: value });
    },
    des: async (value: { [key: string]: any }) => {
        return await interactions.destroy({ where: value });
    },
    up: async (value: { [key: string]: any }, conditions: { [key: string]: any }) => {
        return await interactions.update(value, { where: conditions });
    }
}