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
export let methods = {
    create: async (key: { [value: string]: any }): Promise<notifications> => {
        return await notifications.create({
            sender_id: key.sender_id,
            receiver_id: key.receiver_id,
            content: key.content
        })
    },
    delete: async (notificationId: number): Promise<any> => {
        return await notifications.destroy({
            where: { id: notificationId }
        });
    }
}