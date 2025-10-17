import { sequelize } from '../../configs/sql'
import { Model, DataTypes } from "sequelize";

class chat extends Model {
    declare id: number;
    declare sender_id: string;
    declare receiver_id: string;
    declare member: Array<string>;
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
        member: {
            type: DataTypes.STRING,
            get(this: chat): number[] {
                const rawValue = this.getDataValue('member') as string | null;

                return rawValue ? JSON.parse(rawValue) : [];
            },
            set(this: chat, value: number[]) {

                this.setDataValue('member', JSON.stringify(value));
            }
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
import { contensChat } from './contensChat';
chat.hasMany(contensChat, { foreignKey: 'chatID', as: 'contensChat' })
export { chat }