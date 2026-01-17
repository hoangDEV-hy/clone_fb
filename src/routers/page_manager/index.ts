import express from 'express'
import { route as user } from './Router_User'
import { route as group_user } from './Router_GroupUser'
import { route as Post } from './Router_Post'
import { router as Follower } from './Router_Follower'
import { router as Friend } from './Router_Friend'
let route = express.Router();

route.use('/user', user);
route.use('/group_user', group_user);
route.use('/Post', Post);
route.use('/follower', Follower);
route.use('/friends', Friend);
export { route }