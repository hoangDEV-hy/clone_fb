import express from 'express'
import { authenticate } from '../../middlewares/Mid_Auth'
import { method } from '../../controllers/group/Ctrl_GroupUser';
import { group_user } from '../../models/group_user'
import { Group } from '../../models/Model_Group'
import { Op } from 'sequelize';
let route = express.Router();

route.get('/joined', authenticate.user_auth, async (req: any, res: any) => {
    try {

        const joinedGroups = await method.show_joined(req); // đây là mảng group_user
        const idGroups = joinedGroups.map((g: any) => g.id_group); // trích ra danh sách ID nhóm

        const listGroup = await Group.findAll({
            where: {
                id: idGroups.length > 0 ? { [Op.in]: idGroups } : 0 // tránh lỗi nếu mảng rỗng
            },
            include: [{
                model: group_user,
                required: true
            }]
        });

        const plainGroup = listGroup.map((g: any) => g.toJSON());
        res.render('contens/page_manager/group_user', { group: plainGroup });
    } catch (error) {
        console.error('🔥 Sequelize Error:', error); // 👈 in ra lỗi thật sự
        res.status(500).send('Internal server error');
    }
});

route.get('/waited', authenticate.user_auth, async (req: any, res: any) => {
    try {

        const joinedGroups = await method.show_waited(req); // đây là mảng group_user
        const idGroups = joinedGroups.map((g: any) => g.id_group); // trích ra danh sách ID nhóm

        const listGroup = await Group.findAll({
            where: {
                id: idGroups.length > 0 ? { [Op.in]: idGroups } : 0 // tránh lỗi nếu mảng rỗng
            },
            include: [{
                model: group_user,
                required: true
            }]
        });

        const plainGroup = listGroup.map((g: any) => g.toJSON());
        res.render('contens/page_manager/group', { group: plainGroup });
    } catch (error) {
        console.error('🔥 Sequelize Error:', error); // 👈 in ra lỗi thật sự
        res.status(500).send('Internal server error');
    }
});


export { route }