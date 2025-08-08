import { Request, response, Response } from "express"
import { group_user, method as method_group_user } from "../../models/group_user"
import { Group } from "../../models/group";
import { Op, where, fn, col, literal } from 'sequelize';
export let method = {
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
    show_joined: (req: any): Promise<any> => {
        const id = req.admin.id;
        return method_group_user.select({ id_userA: id, status: 'done' })
    },
    show_waited: (req: any): Promise<any> => {
        const id = req.admin.id;
        return method_group_user.select({ id_userA: id, status: 'pendding' })
    },

}
