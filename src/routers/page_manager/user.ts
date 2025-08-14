import express from 'express'
import { authenticate } from '../../middware/auth'
import { method } from '../../constrollers/page_manager/user';
import { User } from '../../models/user';
import { upload } from '../../middware/updateImage';
import { group_user } from '../../models/group_user';
import { Group } from '../../models/group';
import { Essays } from '../../models/essays';
import { Op } from 'sequelize';
import { sequelize } from '../../configs/sql';


let route = express.Router();

route.get('/', authenticate.user_auth, async (req: any, res: any) => {
    const id = req.admin?.id;
    try {
        const user = await User.findOne({ where: { id: id } });
        interface GroupUserWithEssays extends group_user {
            essays: Essays[];
        }

        const essays = await group_user.findAll({
            where: { id_userA: id },
            include: [
                {
                    model: Essays,
                    as: 'essays',
                    required: true, // inner join
                    on: {
                        '$essays.group_id$': { [Op.eq]: sequelize.col('group_user.id_group') }
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
        }) as GroupUserWithEssays[];

        const allEssays = (essays || [])
            .flatMap(group => group.essays || []) // lấy tất cả essays và flatten
            .filter((essay, index, self) =>
                index === self.findIndex(e => e.id === essay.id) // loại trùng theo id
            );
        const tranAllEssays = allEssays.map((b: any) => b.toJSON());
        tranAllEssays.map((f: any) => {
            f.contens = JSON.parse(f.contens);
            f.contens = JSON.parse(f.contens);

            f.contens = {
                text: f.contens.text,
                image: JSON.stringify(f.contens.image)
            }
        })
        console.log(tranAllEssays);

        // Truyền dữ liệu user vào view
        res.render('contens/page_manager/user', { essays: tranAllEssays, user: user?.toJSON() });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

route.post('/update', authenticate.user_auth, method.updateUser);
route.post('/upload/avatar', upload.single('image'), method.handleUpload, authenticate.user_auth, method.updateAvatarUser);
route.post('/upload/thumbnail', upload.single('image'), method.handleUpload, authenticate.user_auth, method.updateThumbnailUser);


export { route }