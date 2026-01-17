import { User } from '../../models/user'
import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { methods as methods_user_user } from '../../models/user_user';

export let methods = {
    search: async (req: Request, res: Response): Promise<void> => {
        let keyWord = req.query.search?.toString();
        keyWord = keyWord!.toLowerCase();
        await User.findAll({
            where: {
                [Op.or]: [
                    { name: { [Op.like]: `%${keyWord}%` } },
                    { alias: { [Op.like]: `%${keyWord}%` } },
                    { hometown: { [Op.like]: `%${keyWord}%` } },
                    { phoneNumber: { [Op.like]: `%${keyWord}%` } }
                ]
            }
        })
    },
    accepRequest: methods_user_user.up,
    sendRequest: methods_user_user.add,
    delRequest: methods_user_user.del,
    show_friended: (req: any): Promise<any> => {
        const id = req.admin.id;
        return methods_user_user.select({ id_userA: id, status: 'done' })
    },
    show_waited: (req: any): Promise<any> => {
        const id = req.admin.id;
        return methods_user_user.select({ id_userA: id, status: 'pendding' })
    }
}