import { methods } from '../../models/user';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const key = 'hoang1';
async function auth(req: any, res: any) {
    const { id, phone, password } = req.body;
    await methods.checkUser(phone, password, res);
    const token = jwt.sign({ id }, key, { expiresIn: '1h' });
    res.cookie('token', token, {
        httpOnly: true,     // Không truy cập được bằng JavaScript ở phía client
        secure: false,      // true nếu dùng HTTPS
        sameSite: 'strict', // chống CSRF
        maxAge: 3600000
    })
    res.json({ message: 'Đăng nhập thành công' });
}
let method = {
    check: methods.checkUser,
    getPass: methods.getPass,
    setPass: methods.setPass,
    createUser: methods.createUser,
    auth: auth
};

export { method };