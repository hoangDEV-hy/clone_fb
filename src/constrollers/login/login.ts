import { methods, User } from '../../models/user';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const key = 'hoang1';
async function auth(req: Request, res: Response) {
    const { phone, password } = req.body;

    try {
        const user = await User.findOne({
            where: {
                phoneNumber: phone,
                password: password
            }
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid phone number or password' });
        }

        const id = user.id;
        const token = jwt.sign({ id }, key, { expiresIn: '1h' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'strict',
            maxAge: 3600000,
        });

        res.json({ message: 'Đăng nhập thành công' });

    } catch (err) {
        console.error(err);
        return res.status(500).send({ error: 'Internal Server Error' });
    }
}

let method = {
    check: methods.checkUser,
    getPass: methods.getPass,
    setPass: methods.setPass,
    createUser: methods.createUser,
    auth: auth
};

export { method };