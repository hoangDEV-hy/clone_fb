import express from 'express'
let route=express.Router();

route.get('/user', (req: any, res:any)=>{
    res.render('../../../resources/views/contens/page_manager/user');
})

export {route}