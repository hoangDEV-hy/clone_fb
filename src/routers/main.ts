import express from 'express'
import { authenticate } from '../middware/auth';
import { Response, Request } from 'express';
import { Group, methods as model_group } from '../models/group';
import { methods as model_Posts, Posts } from '../models/Posts';
import { methods as model_user, User } from '../models/user';
import { Op } from 'sequelize';
import { user_user } from '../models/user_user';
import { group_user } from '../models/group_user';
import { sequelize } from '../configs/sql';
import { Json } from 'sequelize/types/utils';
let route = express.Router();

route.get('/', authenticate.user_auth, async (req: any, res: Response): Promise<any> => {
    try {
        const idUser = req.admin.id;
        let user = await model_user.selectUser(req.admin.id);
        interface users extends Posts {
            users: User[];
        }

        const userPosts = await Posts.findAll({
            where: {
                [Op.and]: [
                    { user_id: idUser },
                    {
                        [Op.or]: [
                            { scope: 'only_me' },
                            { scope: 'public' }
                        ]
                    }
                ]
            },
            include: [
                {
                    model: User,
                    as: 'users',
                    required: true
                }
            ]
        }) as users[];

        interface userWithPosts extends user_user {
            Posts: Posts[];
        }

        const friendPosts = await user_user.findAll({
            where: { id_userA: idUser },
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
                            { scope: 'friend' },
                            { scope: 'public' }
                        ]
                    },
                    include: [
                        {
                            model: User,
                            as: 'users',
                            required: true,
                        }
                    ]
                }
            ]
        }) as userWithPosts[];
        interface groupWithPosts extends group_user {
            Posts: Posts[];
        }
        const groupPosts = await group_user.findAll({
            where: { id_userA: idUser },
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
                            model: Group,
                            as: 'groups',
                            required: true
                        },
                        {
                            model: User,
                            as: 'users',
                            required: true
                        }
                    ]
                }
            ]
        }) as groupWithPosts[];
        const allPosts = [
            ...(userPosts || []),
            ...friendPosts.flatMap(f => f.Posts || []),
            ...groupPosts.flatMap(g => g.Posts || [])
        ].filter((Post, index, self) =>
            index === self.findIndex(e => e.id === Post.id)
        );
        const tranAllPosts = allPosts.map((b: any) => b.toJSON());
        tranAllPosts.map((f: any) => {
            f.contens = JSON.parse(f.contens);
            if (typeof (f.contens) === "string") f.contens = JSON.parse(f.contens);

            f.contens = {
                text: f.contens.text,
                image: f.contens.image
            }
        })


        //for chatting
        let friend_array: any = await user_user.findAll({ where: { id_userA: idUser }, attributes: ['id_userB'], include: [{ model: User, required: true, attributes: ['name', 'avatar'] }] })
        console.log("allPosts", allPosts)
        res.render('contens/main', { allPosts: tranAllPosts, user: user.toJSON(), friend_array: friend_array.map((e: any) => e.toJSON()) })

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error })
    }

})

export { route };