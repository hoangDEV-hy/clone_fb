import { sequelize } from '../../Configs/Sql'
import { Model, DataTypes } from "sequelize";

class chat extends Model {
    declare id: number;
    declare sender_id: string;
    declare receiver_id: string;
    declare admin: number;
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
        }
    },

    {
        sequelize,
        modelName: 'Chat'
    }
)
import { contentsChat } from './ContentsChat';
chat.hasMany(contentsChat, { foreignKey: 'chatID', as: 'contentsChat' })
export { chat }