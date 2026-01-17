import { group_user } from "../../models/group_user";
import { Group } from "../../models/Model_Group";
import { Posts } from "../../models/Model_Post";
import { Op } from "sequelize";
import { sequelize } from "../../configs/sql";
import { User } from "../../models/Model_User";
let methods = {
    joinGroup_list: async (id: string): Promise<any> => {
        const resuil = await group_user.findAll({
            where:
                { id_userA: id, status: 'done' }
            , include: [
                {
                    model: Group,
                    as: 'groups',
                    required: true
                }
            ]
        })
        return resuil;
    },
    PostsAll_group: async (id: string): Promise<any> => {
        const resuil = await group_user.findAll({
            where:
                { id_userA: id, status: 'done' }
            , include: [
                {
                    model: Posts,
                    as: 'Posts',
                    required: true, // inner join
                    on: {
                        '$Posts.group_id$': { [Op.eq]: sequelize.col('group_user.id_group') }
                    },
                    where: {
                        [Op.or]: [
                            { scope: 'group' }
                        ]
                    },
                    include: [
                        {
                            model: User,
                            as: 'users',
                            required: true,
                        },
                        {
                            model: Group,
                            as: 'groups',
                            required: true
                        }
                    ]
                }
            ]
        })
        return resuil;
    },
}
export { methods };