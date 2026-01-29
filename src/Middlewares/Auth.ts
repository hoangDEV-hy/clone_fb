import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { group_user } from '../Models/GroupUser';
import { Group } from '../Models/Group';
import { methods as controllerLogin } from '../Constrollers/Login/Logins'
import ExtendRequest from '../Types/ExtendRequest';

const secretKey = process.env.JWT_SECRET as string;

export let authenticate = {
    user_auth: (req: Request, res: Response, next: NextFunction): void => {
        const token = req.cookies.token;

        if (!token) {
            res.redirect("/login");
            return;
        }

        try {
            const decoded = jwt.verify(token, secretKey);
            (req as any).admin = decoded;
            next();
        } catch (err) {
            res.status(401).json({ message: 'Token không hợp lệ' });
        }
    },
    adminGroup_auth: async (req: any, res: Response, next: NextFunction): Promise<void> => {
        try {
            const id = req.admin.id;
            if (!await Group.findOne({ where: { admin: id } })) req.session.admin = false;
            else req.session.admin = true;
            next();
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: "có lỗi xảy ra khi xác thực admin group" });
        }

    },
    currentGroup: async (req: ExtendRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const id: number = Number(req.query.id);
            req.session.currentGroupId = id;
            next();
        } catch (err) {
            console.log(err);
            res.status(500).json({ error: "có lỗi xảy ra khi xác thực  group hiện tại" });
        }
    },
    rendToken: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { phone, password } = req.body;

        try {
            let token = await controllerLogin.auth(phone, password);

            res.cookie('token', token, {
                httpOnly: true,
                secure: false,
                sameSite: 'strict',
                maxAge: 3600000,
            });
            next();
        } catch (err: any) {
            console.error(err);
            if (err.message === 'User not found') {
                res.status(401).json({ message: 'Invalid phone number or password' });
                return;
            }
            res.status(500).send({ error: 'Internal Server Error' });
            return;
        }
    }
}

