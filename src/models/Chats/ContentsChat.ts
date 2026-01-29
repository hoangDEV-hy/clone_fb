import { sequelize } from "../../Configs/Sql"
import { Model, DataTypes, DATE } from "sequelize"
class contentsChat extends Model {
    public id!: number;
    public chatID!: number;
    public content!: string;
    public author!: string;
    public type!: string;
}
contentsChat.init({
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
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    sequelize,
    modelName: 'ContentsChat'
})
export { contentsChat }