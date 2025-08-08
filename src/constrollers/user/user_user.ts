import { User } from '../../models/user'
import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { methods as methods_user_user } from '../../models/user_user';
import { user_user } from '../../models/user_user';
import { sequelize } from '../../configs/sql';
import { QueryTypes } from 'sequelize';
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
    },
    manual_friend: async (req: any): Promise<any> => {
        const { id_userA, id_userB } = req.body;

        const results = await sequelize.query(`
        SELECT f1.id_userB AS mutual_friend
        FROM users_users f1
        JOIN users_users f2 ON f1.id_userB = f2.id_userB
        WHERE f1.id_userA = :id_userA
          AND f2.id_userA = :id_userB
          AND f1.status = 'done'
          AND f2.status = 'done'
    `, {
            replacements: { id_userA, id_userB },
            type: QueryTypes.SELECT
        });

        return results; // trả về danh sách bạn chung
    },

    suggest_friend: async (req: any): Promise<any> => {
        const { id_userA } = req.body;

        // Lấy danh sách bạn của id_userA
        const friends = await user_user.findAll({
            where: {
                id_userA,
                status: 'done'
            },
            attributes: ['id_userB']
        });

        const friendIds = friends.map(f => f.id_userB);

        // Lấy bạn của bạn (friend of friend), nhưng loại bỏ id_userA và các bạn đã kết bạn
        const suggestions = await user_user.findAll({
            where: {
                id_userA: { [Op.in]: friendIds },
                status: 'done',
                id_userB: {
                    [Op.notIn]: [...friendIds, id_userA] // tránh trùng chính mình và bạn bè đã kết bạn
                }
            },
            attributes: ['id_userB'],
            group: ['id_userB']
        });

        return suggestions;
    }
}