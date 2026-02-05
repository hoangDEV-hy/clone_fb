import { sequelize } from '../../Configs/Sql'
import { Model, DataTypes, Op } from "sequelize";
import throwError from '../../Helpers/ThrowErrorOfSqlQuery';

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

export const methods = {
    selectedChatsContentsWithSendAndReceive: async (
        sender_id: string,
        receiver_id: string
    ): Promise<chat[]> => {
        try {
            return await chat.findAll({
                where: {
                    [Op.or]: [
                        {
                            [Op.and]: [
                                { sender_id: sender_id },
                                { receiver_id: receiver_id }
                            ]
                        },
                        {
                            [Op.and]: [
                                { sender_id: receiver_id },
                                { receiver_id: sender_id }
                            ]
                        }
                    ]
                },
                include: {
                    model: contentsChat,
                    required: false, // left join
                    as: "contentsChat"
                }
            });
        } catch (err) {
            throwError(err);
            return [];
        }
    },

    createChat: async (
        sender_id: string,
        receiver_id: string
    ): Promise<chat> => {
        try {
            return await chat.create({
                sender_id: sender_id,
                receiver_id: receiver_id
            });
        } catch (err) {
            throwError(err);
            throw err;
        }
    }
};
