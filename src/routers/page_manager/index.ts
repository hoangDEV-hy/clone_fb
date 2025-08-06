import express from 'express'
import { route as user } from './user'
let route = express.Router();

route.use('/user', user);

export { route }