import { raw } from 'express';
import { sequelize } from '../../configs/sql'
import { Model, DataTypes } from "sequelize";

class chat extends Model {
    public id!: number;
    public receiver_id!: string;
    public menber!: Array<string>;
    public contents!: Array<number>;
    public admin!: number;
}
chat.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        receiver_id: {
            type: DataTypes.STRING
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
        contents: {
            type: DataTypes.STRING,
            get(this: chat): number[] {
                const rawValue = this.getDataValue('contents') as string | null;
                return rawValue ? JSON.parse(rawValue) : [];
            },
            set(this: chat, value: number[]) {
                this.setDataValue('contents', JSON.stringify(value));
            }
        },
        admin: {
            type: DataTypes.INTEGER
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