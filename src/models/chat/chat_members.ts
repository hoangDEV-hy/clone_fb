import { sequelize } from "../../configs/sql";
import { Model, DataTypes } from "sequelize";

class chat_member extends Model {
    declare chat_id: number;
    declare idUser: string;
    declare role: string;
    declare status: string
}
chat_member.init({
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
        defaultValue: "guest"
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    sequelize,
    createdAt: true,
    updatedAt: true
})

import { User } from "../user";
// for selecting user information
chat_member.belongsTo(User, {
    foreignKey: 'idUser', as: 'users'
})
export { chat_member }
export let methods = {
    select: async (key: { [value: string]: string }): Promise<chat_member[]> => {
        return chat_member.findAll({
            where: key
        })
    },
    create: async (key: { [value: string]: any }): Promise<chat_member> => {
        return await chat_member.create({
            chat_id: key.chat_id,
            idUser: key.idUser,
            status: key.status
        })
    },
}