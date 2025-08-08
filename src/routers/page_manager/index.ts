import express from 'express'
import { route as user } from './user'
import { route as group_user } from './group_user'
let route = express.Router();

route.use('/user', user);
route.use('/group_user', group_user);

export { route }