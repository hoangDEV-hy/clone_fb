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
export {chat_member}
export let methods = {
    select: async (key: { [value: string]: string }): Promise<chat_member[]> => {
        return chat_member.findAll({
            where: key
        })
    }
}