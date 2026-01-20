import { NextFunction, Request, Response } from 'express';
import { User, methods as userModel } from '../../models/user'; // đường dẫn model tùy theo dự án của bạn
import throwError from '../../helpers/ThrowErrorOfController';


export let methods = {
    takeUser: async (id: string): Promise<User | null> => {
        try {
            return await userModel.selectUser({ id: id });
        } catch (err) {
            throwError(err);
        }
        // if (!user) {
        //     res.status(401).json({ message: 'Invalid user ID' });
        // } else res.json({ user });
    },
    updateUser: async (id: string, name: string): Promise<number> => {
        try {
            return userModel.updateUser({ name: name }, id);
        }
        catch (err) {
            throwError(err);
        }
    },
    handleUpload: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        if (!req.file) {
            res.status(400).send('No file uploaded.');
            return;
        }
        next();
    },
    updateAvatarUser: async (id: string, imagePath: string): Promise<number> => {
        try {

            return await userModel.updateUser({ avatar: imagePath }, id);
        } catch (err) {
            throwError(err);
        }
    },
    updateThumbnailUser: async (id: string, imagePath: string): Promise<number> => {
        try {

            return await userModel.updateUser({ thumbnail: imagePath }, id);
        } catch (err) {
            throwError(err);
        }
    }
}




