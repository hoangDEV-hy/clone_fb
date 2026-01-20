import { group_user } from "../../models/group_user";
import { Group, methods as groupModel } from "../../models/group";
import { Posts } from "../../models/Posts";
import { Op } from "sequelize";
import { sequelize } from "../../configs/sql";
import { User } from "../../models/user";
import throwError from "../../helpers/ThrowErrorOfController";
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
    selectGroup: async (id: number): Promise<Group | null> => {
        try {
            return await groupModel.selectGroup({ id: id });
        } catch (err) {
            throwError(err);
        }
    },
    selectGroupsWithName: async (selectedName: string): Promise<Group[] | null> => {
        try {
            return await groupModel.selectGroups({ name: selectedName });
        } catch (err) {
            throwError(err);
        }
    },
}
export { methods };