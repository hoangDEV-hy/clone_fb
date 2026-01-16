import {
    Model,
    DataTypes,
    Optional,
    Transaction,
    Op
} from 'sequelize';
import { sequelize } from '../configs/sql';

/* ====== Interface ====== */
interface FollowerAttributes {
    id: number;
    follower_id: string;
    following_id: string;
    createdAt?: Date;
}

interface FollowerCreationAttributes
    extends Optional<FollowerAttributes, 'id' | 'createdAt'> { }

/* ====== Model ====== */
class Follower
    extends Model<FollowerAttributes, FollowerCreationAttributes>
    implements FollowerAttributes {
    public id!: number;
    public follower_id!: string;
    public following_id!: string;

    public readonly createdAt!: Date;
}

/* ====== Init ====== */
Follower.init(
    {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        follower_id: {
            type: DataTypes.STRING,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        following_id: {
            type: DataTypes.STRING,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        }
    },
    {
        sequelize,
        tableName: 'followers',
        modelName: 'Follower',

        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,

        indexes: [
            {
                unique: true,
                fields: ['follower_id', 'following_id']
            },
            {
                fields: ['following_id']
            }
        ]
    }
);

export default Follower;

export const methods = {
    selectDanhSach: async (
        selectedFollowerID: string,
        page: number
    ): Promise<Follower[]> => {
        return Follower.findAll({
            attributes: ['following_id'],
            where: {
                follower_id: selectedFollowerID
            },
            order: [['created_at', 'DESC']],
            limit: 50,
            offset: (page - 1) * 50
        });
    },

    addFollowers: async (
        additionedFollowingsID: string[],
        selectedFollowerID: string,
        transaction?: Transaction
    ): Promise<Follower[] | void> => {
        const data = additionedFollowingsID.map((followingID) => ({
            follower_id: selectedFollowerID,
            following_id: followingID
        }));


        return await Follower.bulkCreate(data, {
            transaction
        });

    },

    deleteFollowers: async (
        deletedFollowingsID: string[],
        selectedFollowerID: string,
        transaction?: Transaction
    ): Promise<number> => {
        return Follower.destroy({
            where: {
                follower_id: selectedFollowerID,
                following_id: deletedFollowingsID
            },
            transaction
        });
    },
    selectFollowing: async (
        follower: string,
        following: string
    ): Promise<Follower | null> => {
        try {

            const existingFollowing = await Follower.findOne({
                where: {
                    follower_id: follower,
                    following_id: following,
                },
            });

            return existingFollowing;
        } catch (err) {
            console.error('Error in Model_Follower.selectFollowing:', err);
            throw err;
        }
    },
    selectFollowings: async (userId: string) => {
        return await Follower.findAll({
            where: { follower_id: userId },
            attributes: ['following_id']
        });
    },
    selectIdFollowers: async (userId: string) => {
        return await Follower.findAll({
            where: { follower_id: userId },
            attributes: ['following_id']
        })
    },
    sameFollowingUsers: async (followingIds: string[], userId: string) => {
        return await Follower.findAll({
            where: {
                following_id: { [Op.in]: followingIds },
                follower_id: { [Op.ne]: userId }
            },
            attributes: ['follower_id']
        })
    },
    othersSameFollowingUsers: async (mutualFollowingIds: string[], userId: string) => {
        return await Follower.findAll({
            where: {
                following_id: { [Op.in]: mutualFollowingIds },
                follower_id: { [Op.notIn]: [userId] }
            },
            attributes: ['follower_id']
        });
    }
};

