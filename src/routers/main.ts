import express from 'express'
import { authenticate } from '../middware/auth';
import { Response, Request } from 'express';
import { Group, methods as model_group } from '../models/group';
import { methods as model_essays, Essays } from '../models/essays';
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
        interface users extends Essays {
            users: User[];
        }

        const userEssays = await Essays.findAll({
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

        interface userWithEssays extends user_user {
            essays: Essays[];
        }

        const friendEssays = await user_user.findAll({
            where: { id_userA: idUser },
            include: [
                {
                    model: Essays,
                    as: 'essays',
                    required: true, // inner join
                    on: {
                        '$essays.user_id$': { [Op.eq]: sequelize.col('user_user.id_userB') }
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
        }) as userWithEssays[];
        interface groupWithEssays extends group_user {
            essays: Essays[];
        }
        const groupEssays = await group_user.findAll({
            where: { id_userA: idUser },
            include: [
                {
                    model: Essays,
                    as: 'essays',
                    required: true, // inner join
                    on: {
                        '$essays.group_id$': { [Op.eq]: sequelize.col('group_user.id_group') }
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
        }) as groupWithEssays[];
        const allEssays = [
            ...(userEssays || []),
            ...friendEssays.flatMap(f => f.essays || []),
            ...groupEssays.flatMap(g => g.essays || [])
        ].filter((essay, index, self) =>
            index === self.findIndex(e => e.id === essay.id)
        );
        const tranAllEssays = allEssays.map((b: any) => b.toJSON());
        tranAllEssays.map((f: any) => {
            f.contens = JSON.parse(f.contens);
            f.contens = JSON.parse(f.contens);

            f.contens = {
                text: f.contens.text,
                image: f.contens.image
            }
        })
        console.log(tranAllEssays)
        res.render('contens/main', { allEssays: tranAllEssays })

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error })
    }

})

export { route };