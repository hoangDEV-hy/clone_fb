import express from 'express';
import { method as methods } from '../../constrollers/login/login';
type MethodType = {
    check: (a: string, b: string, res: any) => void;
    getPass: (req: any, res: any) => void;
    setPass: (req: any, res: any) => void;
    createUser: (req: any, res: any) => void;
    auth: (req: any, res: any) => void;
};

let method: MethodType = {
    check: methods.check,
    getPass: methods.getPass,
    setPass: methods.setPass,
    createUser: methods.createUser,
    auth: methods.auth
};

const router = express.Router();

// không cần tạo lại object mới nếu không cần
router.get('/login', (req: any, res: any) => {
    res.render('contens/login_dangKi/login');

});
router.post('/login', method.auth);

router.get('/login/setPass', method.getPass);
router.post('/login/setPass', method.setPass);


router.get('/login/register', (req: any, res: any) => {
    res.render('contens/login_dangKi/dangKi')
})
router.post('/login/register', method.createUser)

export { router };

