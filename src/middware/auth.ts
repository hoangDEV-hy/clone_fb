import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { group_user } from '../models/group_user';
import { Group } from '../models/group';

const secretKey = 'hoang1';

export let authenticate = {
    user_auth: (req: Request, res: Response, next: NextFunction): void => {
        const token = req.cookies.token;

        if (!token) {
            res.status(401).json({ message: 'Không có token, từ chối truy cập' });
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
            res.status(500).json(error);
        }

    }
}

