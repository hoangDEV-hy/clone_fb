import { sequelize } from "../configs/sql";
import { DataTypes, Model } from "sequelize";
import { User } from "./user";
import throwError from "../helpers/ThrowErrorOfSqlQuery";
import { QueryTypes } from "sequelize";
import { Op } from 'sequelize';


class interactions extends Model {
    declare id: number;
    declare id_user: string;
    declare id_Posts: number;
    declare classify: string;
    declare content: string; // fix here
    declare origin: string[]; // JSON array of strings
}

interactions.init({
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    id_user: {
        type: DataTypes.STRING,
        allowNull: false
    },
    id_Posts: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    classify: {
        type: DataTypes.STRING,
    },
    content: {
        type: DataTypes.TEXT,

    },
    origin: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: '[]',
        get() {
            const raw = this.getDataValue('origin');
            return raw ? JSON.parse(raw) : [];
        },
        set(value: any[]) {
            this.setDataValue('origin', JSON.stringify(value));
        }
    }
}, {
    sequelize,
    tableName: 'interactions',
    modelName: 'interactions',
    timestamps: true
})
//for take many information of user
interactions.belongsTo(User, { foreignKey: 'id_user' })
export { interactions };

export let methods = {
    createInteraction: async (data: Partial<interactions>): Promise<interactions> => {
        try {
            return await interactions.create(data);
        } catch (err) {
            throwError(err);
        }
    },
    selectInteractions: async (data: Partial<interactions>): Promise<interactions[]> => {

        try {
            return await interactions.findAll({ where: data });
        } catch (err) {
            throwError(err);
        }
    },
    destroyInteraction: async (data: Partial<interactions>): Promise<number> => {
        try {
            return await interactions.destroy({ where: data });
        } catch (err) {
            throwError(err);
        }
    },
    updateInteraction: async (data: Partial<interactions>, conditions: Partial<interactions>): Promise<number> => {
        try {
            const [result] = await interactions.update(data, { where: conditions });
            return result;
        } catch (err) {
            throwError(err);
        }

    },
    selectLikeStatus: async (selectedIdPosts: number[], selectedIdUser: string): Promise<interactions[]> => {
        try {
            return await sequelize.query(
                `SELECT id_Posts,
        COUNT(*) AS totalLikes,
        CASE WHEN SUM(CASE WHEN id_user = :id_user THEN 1 ELSE 0 END) > 0 THEN 1 ELSE 0 END AS likedByUser
     FROM interactions
     WHERE id_Posts IN (:Posts_data) AND classify = 'like'
     GROUP BY id_Posts`,
                {
                    replacements: { selectedIdPosts, selectedIdUser },
                    type: QueryTypes.SELECT
                }
            );

        } catch (err) {
            throwError(err);
        }
    },
    selectedShareCount: async (selectedIdPosts: number[]): Promise<interactions[]> => {
        try {
            return await interactions.findAll({
                attributes: [
                    'id_Posts',
                    [sequelize.fn('COUNT', sequelize.col('id_Posts')), 'totalShares']
                ],
                where: {
                    id_Posts: selectedIdPosts, // mảng các id bài viết
                    classify: 'share'
                },
                group: ['id_Posts']
            });
        } catch (err) {
            throwError(err);
        }
    },
    selectCommendData: async (selectedIdPosts: number[]): Promise<interactions[]> => {
        try {
            return await interactions.findAll({
                where: {
                    classify: 'commend',
                    id_Posts: selectedIdPosts
                },
                attributes: ['id', 'id_Posts', 'id_user', 'content'], // chỉ các cột có trong interactions
                include: [
                    {
                        model: User,
                        attributes: ['name', 'avatar'], // lấy name, avatar từ bảng users,
                        required: true

                    }
                ]
            });
        } catch (err) {
            throwError(err);
        }
    },
    destroyInteractions: async (selectedInteractionIds: number[]): Promise<number> => {
        try {
            return await interactions.destroy({
                where: {
                    id: { [Op.in]: selectedInteractionIds },
                },
            });
        } catch (err) {
            throwError(err);
        }
    },
    createInteractions: async (data: Partial<interactions>[]): Promise<interactions[]> => {
        try {
            return await interactions.bulkCreate(data);
        } catch (err) {
            throwError(err);
        }
    },
}