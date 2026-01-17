import { sequelize } from '../configs/sql'
import { DataTypes, Model, Op, WhereOptions } from 'sequelize'

import WhereOfSelectPost from '../types/Type_WhereOfSelectPost';
class Posts extends Model {
    declare id: number;
    declare group_id: number;
    declare user_id: string;
    declare contens: string;
    declare scope: string;
    declare think: string;
    declare PostId_origin: number
}

Posts.init({
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
    },
    scope: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'only_me'
    },
    think: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    PostId_origin: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    sequelize,
    timestamps: true
});
import { User } from './Model_User';
import { Group } from './Model_Group';
import { user_user } from './Model_UserUser';
import { group_user } from './group_user';
import { interactions } from './Model_Interactions';
Posts.belongsTo(User, { as: 'users', foreignKey: 'user_id' })
Posts.belongsTo(Group, {
    as: 'groups', foreignKey: {
        name: 'group_id',
        allowNull: true
    }
})
Posts.hasMany(interactions, { as: 'interactions', foreignKey: 'id_Posts' })



export { Posts }

export let methods = {
    create: async (value: { [key: string]: string }) => {
        return await Posts.create(value);
    },
    select: async (value: { [key: string]: any }) => {
        return await Posts.findAll({ where: value });
    },
    des: async (value: { [key: string]: any }) => {
        return await Posts.destroy({ where: value });
    },
    up: async (value: { [key: string]: any }, conditions: { [key: string]: any }) => {
        return await Posts.update(value, { where: conditions });
    },
    selectPosts: async (whereClause: WhereOptions, limit: number) => {
        return await Posts.findAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    as: 'users',
                    attributes: ['id', 'name', 'alias', 'avatar']
                },
                {
                    model: interactions,
                    as: 'interactions',
                    attributes: ['id', 'id_user', 'classify', 'createdAt']
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: limit * 2
        })

    },
    selectFriendsPost: async (userId: string) => {
        return await user_user.findAll({
            where: {
                [Op.or]: [
                    { id_userA: userId, status: 'done' },
                    { id_userB: userId, status: 'done' }
                ]
            },
            include: [
                {
                    model: Posts,
                    as: 'Posts',
                    required: true, // inner join
                    on: {
                        '$Posts.user_id$': { [Op.eq]: sequelize.col('user_user.id_userB') }
                    },
                    where: {
                        [Op.or]: [
                            { scope: 'group' },
                            { scope: 'public' }
                        ]
                    },
                    include: [
                        {
                            model: User,
                            as: 'users',
                            attributes: ['id', 'name', 'alias', 'avatar']
                        },
                        {
                            model: interactions,
                            as: 'interactions',
                            attributes: ['id', 'id_user', 'classify']
                        }
                    ]
                }
            ]
        })
    },
    selectGroupsPost: async (userId: string) => {
        return await group_user.findAll({
            where: { id_userA: userId, status: 'active' },
            include: [
                {
                    model: Posts,
                    as: 'Posts',
                    required: true, // inner join
                    on: {
                        '$Posts.group_id$': { [Op.eq]: sequelize.col('group_user.id_group') }
                    },
                    where: {
                        [Op.or]: [
                            { scope: 'group' },
                            { scope: 'public' }
                        ]
                    },
                    include: [
                        {
                            model: User,
                            as: 'users',
                            attributes: ['id', 'name', 'alias', 'avatar']
                        },
                        {
                            model: Group,
                            as: 'groups',
                            attributes: ['id', 'name']
                        },
                        {
                            model: interactions,
                            as: 'interactions',
                            attributes: ['id', 'id_user', 'classify']
                        }
                    ]
                }
            ]
        })
    },
    selectSameGroupUsers: async (groupIds: number[], userId: string) => {
        return await group_user.findAll({
            where: {
                id_group: { [Op.in]: groupIds },
                id_userA: { [Op.ne]: userId },
                status: 'active'
            },
            attributes: ['id_userA']
        })
    },
    selectIdGroups: async (userId: string) => {
        return await group_user.findAll({
            where: { id_userA: userId, status: 'active' },
            attributes: ['id_group']
        })
    },
}

