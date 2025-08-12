import express from 'express'
import { authenticate } from '../../middware/auth'
import { methods } from '../../models/group';
const router = express.Router();

router.get('/create', authenticate, (req: any, res: any) => {
    res.render('contens/groups/register');
});
router.get('/', authenticate, async (req: any, res: any) => {
    //const id=req.body;
    const id=1;
    const group = await methods.select(id); // cần await
    req.session.currentGroupId = id;
    res.json(group?.toJSON()); // ?. để tránh undefined
});


export { router };