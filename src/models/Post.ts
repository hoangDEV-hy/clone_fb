import { sequelize } from '../Configs/Sql'
import { DataTypes, Model, Op, WhereOptions } from 'sequelize'

import WhereOfSelectPost from '../Types/WhereOfSelectPost';
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
import { User } from './user';
import { Group } from './Group';
import { user_user } from './UserUser';
import { group_user } from './GroupUser';
import { interactions } from './Interactions';
import throwError from '../Helpers/ThrowErrorOfSqlQuery';
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
    create: async (data: Partial<Posts>) => {
        return await Posts.create(data);
    },
    selectPosts: async (data: Partial<Posts>) => {
        try {
            return await Posts.findAll({ where: data });
        } catch (err) {
            throwError(err);
        }
    },
    selectPost: async (data: Partial<Posts>) => {
        try {
            return await Posts.findOne({ where: data });
        } catch (err) {
            throwError(err);
        }
    },
    des: async (data: Partial<Posts>) => {
        try {
            return await Posts.destroy({ where: data });
        } catch (err) {
            throwError(err);
        }
    },
    up: async (data: Partial<Posts>, conditions: { [key: string]: any }) => {
        return await Posts.update(data, { where: conditions });
    },
    selectPostsWithUserAndInteraction: async (whereClause: WhereOptions, limit: number) => {
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
            where: {
                id_userA: userId,
                status: 'active'
            },
            include: [
                {
                    model: Posts,
                    as: 'Posts',
                    required: true, // inner join
                    on: {
                        '$Posts.group_id$': {
                            [Op.eq]: sequelize.col('group_user.id_group')
                        }
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
        });
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
    selectPostWithUserAndGroup: async (selectedPostIdCurtain: number): Promise<Posts | null> => {
        try {
            return await Posts.findOne({

                where: { id: selectedPostIdCurtain },
                include: [
                    {
                        model: User,
                        as: 'users',
                        required: false

                    },
                    {
                        model: Group,
                        as: 'groups',
                        required: false
                    }
                ]
            });
        } catch (err) {
            throwError(err);
        }
    },
    selectPostsWithUserAndGroup: async (selectedTargetId: string): Promise<Posts[]> => {
        try {
            return await Posts.findAll({

                where: { user_id: selectedTargetId },
                include: [
                    {
                        model: User,
                        as: 'users',
                        required: false

                    },
                    {
                        model: Group,
                        as: 'groups',
                        required: false
                    }
                ]
            });
        } catch (err) {
            throwError(err);
        }
    },
    selectPostWithUserGroupAndCountInteraction: async (selectedTargetId: string, selectedSort: string): Promise<Posts[]> => {
        try {
            return await Posts.findAll({
                attributes: {
                    include: [
                        [
                            sequelize.literal(`(
                SELECT COUNT(*)
                FROM interactions AS i
                WHERE i.id_Posts = Posts.id
                  AND i.classify LIKE '${selectedSort}'
            )`),
                            'interactionCount'
                        ]
                    ]
                },
                where: { user_id: selectedTargetId },
                include: [
                    {
                        model: Group,
                        as: 'groups',
                        required: false
                    },
                    {
                        model: User,
                        as: 'users',
                        required: false
                    }
                ],
                order: [[sequelize.literal('interactionCount'), 'DESC']]
            })
        } catch (err) {
            throwError(err);
        }
    },
    selectPostsWithUser: async (data: Partial<Posts>) => {
        try {
            return await Posts.findAll({
                where: data,
                include: [
                    {
                        model: User,
                        as: 'users',
                        required: true
                    }
                ]
            });
        } catch (err) {
            throwError(err);
        }
    },
    selectPostsWithFilter_InteractionAndUser: async (data: Partial<Posts>, sort: string): Promise<Posts[]> => {
        try {
            return await Posts.findAll({
                attributes: {
                    include: [
                        [
                            sequelize.literal(`(
                SELECT COUNT(*)
                FROM interactions AS i
                WHERE i.id_Posts = Posts.id
                  AND i.classify LIKE '${sort}'
            )`),
                            'interactionCount'
                        ]
                    ]
                },
                where: data,
                include: [
                    {
                        model: User,
                        as: 'users',
                        required: false
                    }
                ],
                order: [[sequelize.literal('interactionCount'), 'DESC']]
            })
        } catch (err) {
            throwError(err);
        }
    }
}

