import { sequelize } from "../../configs/sql"
import { Model, DataTypes, DATE } from "sequelize"
class contensChat extends Model {
    public id!: number;
    public chatID!: number;
    public contens!: string;
    public author!: string;
}
contensChat.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    chatID: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    content: {
        type: DataTypes.STRING,
        allowNull: false
    },
    author: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    sequelize,
    modelName: 'ContensChat'
})
export { contensChat }