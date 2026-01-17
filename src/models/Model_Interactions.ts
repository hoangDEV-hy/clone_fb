import { sequelize } from "../configs/sql";
import { DataTypes, Model } from "sequelize";
import { User } from "./Model_User";

class interactions extends Model {
    declare id: number;
    declare id_user: string;
    declare id_Posts: number;
    declare classify: string;
    declare content: string; // fix here
    declare origin: string[]; // JSON array of strings
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
    id_Posts: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    classify: {
        type: DataTypes.STRING,
    },
    content: {
        type: DataTypes.TEXT,

    },
    origin: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: '[]',
        get() {
            const raw = this.getDataValue('origin');
            return raw ? JSON.parse(raw) : [];
        },
        set(value: any[]) {
            this.setDataValue('origin', JSON.stringify(value));
        }
    }
}, {
    sequelize,
    tableName: 'interactions',
    modelName: 'interactions',
    timestamps: true
})
//for take many information of user
interactions.belongsTo(User, { foreignKey: 'id_user' })
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