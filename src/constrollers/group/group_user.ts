import { Request, response, Response } from "express"
import { group_user, methods as GroupUserMethod } from "../../models/group_user"
import { Group } from "../../models/group";
import {methods as groupController} from "../../constrollers/"
import { Op, where, fn, col, literal } from 'sequelize';
import throwError from "../../helpers/ThrowErrorOfController";
export let methods = {
    search: async (req: any, res: Response): Promise<void> => {
        try {
            const { name = '', hastag = '' } = req.body;

            const list = await Group.findAll({
                where: {
                    [Op.or]: [
                        name && where(fn('LOWER', col('name')), {
                            [Op.like]: `%${name.toLowerCase()}%`
                        }),
                        hastag && where(fn('LOWER', col('hastag')), {
                            [Op.like]: `%${hastag.toLowerCase()}%`
                        })
                    ].filter(Boolean)
                }
            });

            res.json({ list });
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: 'Failed to search' });
        }
    },
    getJoined: (selectedIdUser: string): Promise<group_user[]> => {
        try {
            return GroupUserMethod.selectJoinGroups({ id_userA: selectedIdUser, status: 'done' })
        } catch (err) {
            throwError(err);
        }
    },
    show_waited: (req: any): Promise<any> => {
        const id = req.admin.id;
        return methodsGroupUser.select({ id_userA: id, status: 'pendding' })
    },
    selectGroupsGroupuserByOp_in:(idGroups:number[]):Promise<Group[]>=>{
        try{
            return await GroupUserMethod.
        }
    }

}
