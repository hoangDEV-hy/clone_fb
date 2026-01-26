import express from 'express'
import { route as user } from './user'
import { router as group_user } from './group_user'
import { route as Post } from './Post'
import { router as Follower } from './Router_Follower'
import { router as Friend } from './friend'
let route = express.Router();

route.use('/user', user);
route.use('/', group_user);
route.use('/Post', Post);
route.use('/follower', Follower);
route.use('/friends', Friend);
export { route }