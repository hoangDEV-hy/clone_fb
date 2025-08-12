import { sequelize } from '../configs/sql'
import { DataTypes, Model } from 'sequelize'

class Essays extends Model {
    declare id: number;
    declare group_id: number;
    declare user_id: string;
    declare contens: string;
}

Essays.init({
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    group_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    contens: {
        type: DataTypes.TEXT
    }
}, {
    sequelize,
    timestamps: true
});
import { Response } from 'express';
export let methods = {
    // create: async (value: { [key: string]: string }, res: Response): Promise<any> => {
    //     try {

    //         await Essays.create({ value });
    //     } catch (error) {
    //         console.log(error);
    //         return res.json(error);
    //     }

    // }
    create: async (value: { [key: string]: string }) => {
        return await Essays.create(value);
    }
}