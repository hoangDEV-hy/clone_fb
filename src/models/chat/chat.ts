import { sequelize } from '../../configs/sql'
import { Model, DataTypes } from "sequelize";

class chat extends Model {
    declare id: number;
    declare sender_id: string;
    declare receiver_id: string;
    declare admin: number;
    declare name: string;
    declare type:string;
}
chat.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        sender_id: {
            type: DataTypes.STRING,
            allowNull: false
        },
        receiver_id: {
            type: DataTypes.STRING,
            allowNull: false
        },
        admin: {
            type: DataTypes.STRING
        },
        name: {
            type: DataTypes.STRING
        },
        type:{
            type:DataTypes.STRING
        }
    },

    {
        sequelize,
        modelName: 'Chat'
    }
)
import { contensChat } from './contensChat';
chat.hasMany(contensChat, { foreignKey: 'chatID', as: 'contensChat' })
export { chat }