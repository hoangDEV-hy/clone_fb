import { sequelize } from "../../configs/sql"
import { Model, DataTypes } from "sequelize"
class contensChat extends Model {
    public id!: number;
    public chatID!: number;
    public contens!: string;
}
contensChat.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    chatID: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    content: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    sequelize,
    modelName: 'ContensChat'
})
export { contensChat }