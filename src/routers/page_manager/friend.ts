import express from "express";
import { authenticate } from '../../middware/auth';
import { methods } from '../../constrollers/user/user_user';
import { User } from "../../models/user";
import { Op } from "sequelize";
import { user_user } from "../../models/user_user";
let route = express.Router();

route.get('/joined', authenticate.user_auth, async (req: any, res: any) => {
    try {

        const friended = await methods.show_friended(req); // đây là mảng group_user
        const idfriends = friended.map((g: any) => g.id_userB); // trích ra danh sách ID nhóm

        const listFriends = await User.findAll({
            where: {
                id: idfriends.length > 0 ? { [Op.in]: idfriends } : 0 // tránh lỗi nếu mảng rỗng
            },
            include: [{
                model: user_user,
                required: true
            }]
        });

        const plainFriend = listFriends.map((g: any) => g.toJSON());
        res.render('contens/page_manager/friend', { group: plainFriend });
    } catch (error) {
        console.error('🔥 Sequelize Error:', error); // 👈 in ra lỗi thật sự
        res.status(500).send('Internal server error');
    }
});

route.get('/waited', authenticate.user_auth, async (req: any, res: any) => {
    try {

        const friended = await methods.show_waited(req); // đây là mảng group_user
        const idfriends = friended.map((g: any) => g.id_userB); // trích ra danh sách ID nhóm

        const listFriends = await User.findAll({
            where: {
                id: idfriends.length > 0 ? { [Op.in]: idfriends } : 0 // tránh lỗi nếu mảng rỗng
            },
            include: [{
                model: user_user,
                required: true
            }]
        });

        const plainFriend = listFriends.map((g: any) => g.toJSON());
        res.render('contens/page_manager/friend', { group: plainFriend });
    } catch (error) {
        console.error('🔥 Sequelize Error:', error); // 👈 in ra lỗi thật sự
        res.status(500).send('Internal server error');
    }
});

export { route }