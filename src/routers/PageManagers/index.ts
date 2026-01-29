import express from 'express'
import { router as user } from './Users'
import { router as group_user } from './GroupUsers'
import { router as Post } from './Posts'
import { router as Follower } from './Router_Follower'
import { router as Friend } from './UserUsers'
let router = express.Router();

router.use('/user', user);
router.use('/', group_user);
router.use('/Post', Post);
router.use('/follower', Follower);
router.use('/friends', Friend);
export { router }