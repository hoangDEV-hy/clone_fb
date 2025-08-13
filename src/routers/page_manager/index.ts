import express from 'express'
import { route as user } from './user'
import { route as group_user } from './group_user'
import { route as essay } from './essay'
let route = express.Router();

route.use('/user', user);
route.use('/group_user', group_user);
route.use('/essay', essay);

export { route }