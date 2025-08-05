import express from 'express'
import { authenticate } from '../../middware/auth'
import Message from 'tedious/lib/message';
const router = express.Router();

router.get('/create', authenticate, (req: any, res: any) => {
    res.render('contens/groups/register');
});


export { router };