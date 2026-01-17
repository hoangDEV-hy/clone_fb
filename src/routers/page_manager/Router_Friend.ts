import express from "express";
import { authenticate } from '../../middlewares/Mid_Auth';
import { methods } from '../../controllers/user/Ctrl_UsersUsers';
import { User } from "../../models/Model_User";
import { Op } from "sequelize";
import { user_user } from "../../models/Model_UserUser";
let router = express.Router();

router.get('/joined', authenticate.user_auth, async (req: any, res: any) => {
    try {

        const friended = await methods.show_friended(req); // đây là mảng group_user
        const idfriends = friended.map((g: any) => g.id_userB); // trích ra danh sách ID nhóm

        const listFriends = await User.findAll({
            where: {
                id: idfriends.length > 0 ? { [Op.in]: idfriends } : 0 // tránh lỗi nếu mảng rỗng
            }
        });

        const plainFriend = listFriends.map((g: any) => g.toJSON());
        res.render('contens/page_manager/friend', { group: plainFriend });
    } catch (error) {
        console.error('🔥 Sequelize Error:', error);
        res.status(500).send('Internal server error');
    }
});

router.get('/waited', authenticate.user_auth, async (req: any, res: any) => {
    try {
        const friended = await methods.show_waited(req);
        const idfriends = friended.map((g: any) => g.id_userB);

        if (idfriends.length === 0) {
            res.render('contens/page_manager/friend');
            return;
        }

        const listFriends = await User.findAll({
            where: {
                id: idfriends.length > 0 ? { [Op.in]: idfriends } : 0
            }
        });

        const plainFriend = listFriends.map((g: any) => g.toJSON());
        res.render('contens/page_manager/friend', { group: plainFriend });

    } catch (error) {
        console.error('🔥 Sequelize Error:', error);
        res.status(500).send('Internal server error');
    }
});


export { router }