import { sequelize } from "../../configs/sql"
import { DataTypes, Model } from "sequelize"

class config_chat extends Model {
    declare chat_id: number;
    declare author: string;
    declare nickname: string
}

config_chat.init({
    chat_id: {
        type: DataTypes.INTEGER,
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

export let config_chatFunc = {
    create_config: (data: { [key: string]: string }) => {
        try {
            return config_chat.create(data)
        } catch (error) {
            console.error("Lỗi khi tạo config:", error)
        }
    },
    update_config: (dataEdit: { [key: string]: string }, dataWhere: { [key: string]: string }) => {
        try {
            return config_chat.update(dataEdit, { where: dataWhere })
        } catch (error) {
            console.error("Lỗi khi truy cập config:", error)
        }
    }
} 