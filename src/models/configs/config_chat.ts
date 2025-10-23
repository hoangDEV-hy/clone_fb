import { sequelize } from "../../configs/sql"
import { DataTypes, Model } from "sequelize"

class config_chat extends Model {
    declare chat_id: number;
    declare author: string;
    declare nickname: string
}

config_chat.init({
    chat_id: {
        type: DataTypes.NUMBER,
        allowNull: false
    },
    author: {
        type: DataTypes.STRING,
        allowNull: false
    },
    nickName: {
        type: DataTypes.STRING
    }
},
    {
        sequelize,
        modelName: "config_chat"
    })
export { config_chat }

