import { sequelize } from "../configs/sql";
import { DataTypes, Model } from "sequelize";

class notifications extends Model {
    declare id: number;
    declare sender_id: number;
    declare receiver_id: string;
    declare content: string
}

notifications.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
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
    content: {
        type: DataTypes.STRING
    }
}, {
    sequelize,
    updatedAt: true,
    createdAt: true
})