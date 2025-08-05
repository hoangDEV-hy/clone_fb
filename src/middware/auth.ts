import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const secretKey = 'hoang1';

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
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
};
