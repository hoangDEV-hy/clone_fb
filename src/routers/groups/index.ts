import express from 'express'
import { authenticate } from '../../middware/auth'
import { methods } from '../../models/group';
const router = express.Router();

router.get('/create', authenticate.user_auth, (req: any, res: any) => {
    res.render('contens/groups/register');
});
router.get('/', authenticate.user_auth, authenticate.adminGroup_auth, async (req: any, res: any) => {
    try {

        const id = 1;
        const group = await methods.select(id); // cần await
        req.session.currentGroupId = id;
        res.json(group?.toJSON()); // ?. để tránh undefined
    } catch (error) {
        console.log(error);
    }
    //const id=req.body;
});


export { router };