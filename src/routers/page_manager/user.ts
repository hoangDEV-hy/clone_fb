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
        const user = await User.findOne({ where: { id } });

        const essays = await Essays.findAll({
            where: { user_id: id },
            include: [
                { model: Group, as: 'groups', required: false },
                { model: User, as: 'users', required: false }
            ]
        });
        console.log(essays)




        // Chuyển từng instance Sequelize thành object thuần và xử lý contens
        const tranAllEssays = essays.map((essay: any) => {
            const obj = essay.toJSON ? essay.toJSON() : essay;

            try {
                let parsed = JSON.parse(obj.contens || '{}');
                if (typeof parsed === 'string') {
                    parsed = JSON.parse(parsed);
                }

                let imageValue = parsed.image || null;

                if (imageValue && typeof imageValue === "object") {
                    // Nếu là object → stringify
                    imageValue = JSON.stringify(imageValue);
                }

                // Nếu đã là string thì giữ nguyên
                obj.contens = {
                    text: parsed.text || '',
                    image: imageValue
                };
            } catch {
                obj.contens = { text: '', image: 'null' };
            }

            return obj;
        });
        //console.log(tranAllEssays);
        return res.render('contens/page_manager/user', {
            essays: tranAllEssays,
            user: user?.toJSON()
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
});


route.post('/update', authenticate.user_auth, method.updateUser);
route.post('/upload/avatar', upload.single('image'), method.handleUpload, authenticate.user_auth, method.updateAvatarUser);
route.post('/upload/thumbnail', upload.single('image'), method.handleUpload, authenticate.user_auth, method.updateThumbnailUser);


export { route }