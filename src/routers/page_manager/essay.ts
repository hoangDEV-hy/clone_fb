import { Request, Response } from "express";
import { methods as model_group } from '../../models/group';
import { methods as model_essays, Essays } from '../../models/essays';
import { authenticate } from '../../middware/auth'
import express from "express"
import { methods as model_user, User } from '../../models/user';

let route = express.Router();

route.get('/', authenticate.user_auth, async (req: any, res: Response): Promise<any> => {
    try {
        const idUser = req.admin.id;
        const isAdmin = req.session.admin;
        //const idGroup = req.session.currentGroupId;
        const idGroup = 1;
        console.log('iduser', idUser, 'isAdmin', isAdmin, 'idGroup', idGroup);
        let user = await model_user.selectUser(req.admin.id);
        let group = await model_group.select(idGroup);
        let essays = await model_essays.select({ user_id: idUser, group_id: idGroup, scope: 'group' })
        const essays_tranforme = essays.map((b: any) => {

            let contenObj = JSON.parse(b.contens);
            if (typeof contenObj === 'string') {
                contenObj = JSON.parse(contenObj);
            }
            return {
                id: b.id,
                users: {
                    name: user.name,
                    avatar: user.avatar
                },
                contens: {

                    text: contenObj.text,
                    image: JSON.stringify(contenObj.image)
                },
                updatedAt: b.updatedAt
            }
        })
        console.log(essays_tranforme);
        res.render('contens/page_manager/essay', { user: user.toJSON(), group: group.toJSON(), essays: essays_tranforme, isAdmin: true })

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error })
    }

})
route.get('/admin', async (req: any, res: Response): Promise<any> => {
    try {

        const isAdmin = req.session.admin;

        //const idGroup = req.session.currentGroupId;
        const idGroup = 1;
        let group = await model_group.select(idGroup);
        let essays = await Essays.findAll({
            where: { group_id: idGroup, scope: 'group' },
            include: [{
                model: User,
                as: 'users',
                required: true
            }]
        });


        const essays_tranforme = essays.map((b: any) => {
            b = b.toJSON();
            b.contens = JSON.parse(b.contens);
            b.contens = JSON.parse(b.contens);
            b.contens = {
                text: b.contens.text,
                image: JSON.stringify(b.contens.image)
            }
            return b;
        })
        console.log(essays_tranforme)
        res.render('contens/page_manager/essay', { group: group?.toJSON?.(), essays: essays_tranforme })

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error })
    }
})
route.delete('/del', authenticate.user_auth, async (req: any, res: Response): Promise<any> => {
    const id = req.body;
    await model_essays.des(id);
    const idUser = req.admin.id;
    const isAdmin = req.session.admin;
    //const idGroup = req.session.currentGroupId;
    const idGroup = 1;
    console.log('iduser', idUser, 'isAdmin', isAdmin, 'idGroup', idGroup);
    let user = await model_user.selectUser(req.admin.id);
    let group = await model_group.select(idGroup);
    let essays = await model_essays.select({ user_id: idUser, group_id: idGroup, scope: 'group' })
    const essays_tranforme = essays.map((b: any) => {

        let contenObj = JSON.parse(b.contens);
        if (typeof contenObj === 'string') {
            contenObj = JSON.parse(contenObj);
        }
        return {
            id: b.id,
            text: contenObj.text,
            image: JSON.stringify(contenObj.image)
        }
    })
    res.render('contens/page_manager/essay', { user: user.toJSON(), group: group.toJSON(), essay: essays_tranforme, isAdmin: isAdmin })
})
route.get('/update', authenticate.user_auth, async (req: any, res: Response): Promise<any> => {
    const id = req.body;
    let essay = await Essays.findOne({ where: id });
    let contenObj = JSON.parse(essay!.contens);
    if (typeof contenObj === 'string') {
        contenObj = JSON.parse(contenObj);
    }
    const essays_tranforme = {
        text: contenObj.text,
        image: JSON.stringify(contenObj.image)
    }
    console.log(essay)
    res.render('contens/essay', { essay: essay?.toJSON(), conten: essays_tranforme })
})

export { route };