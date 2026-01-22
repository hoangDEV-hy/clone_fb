import { methods as modelUser, User } from '../../models/user';
import throwError from '../../helpers/ThrowErrorOfController';
import jwt from 'jsonwebtoken';


const key = process.env.JWT_SECRET as string;
const methods = {
    auth: async (selectedPhone: string, selectedPassword: string): Promise<string> => {
        try {
            const user = await modelUser.selectUser({
                phoneNumber: selectedPhone,
                password: selectedPassword
            });

            if (!user) {
                throw new Error('User not found');
            }

            const id = user.id;

            return jwt.sign({ id }, key, { expiresIn: '1h' });
        } catch (err) {
            throwError(err);
        }
    },
    checkUser: async (id: string): Promise<User | null> => {
        try {
            return await modelUser.selectUser({ id: id })
        } catch (err) {
            throwError(err);
        }
    },
    updateUser: async (data: Partial<User>, id: string): Promise<Number> => {
        try {
            return await modelUser.updateUser(data, id);
        } catch (err) {
            throwError(err);
        }
    },
    getPass: async (selectedInputPhone: string): Promise<string | undefined> => {
        try {
            const user = await modelUser.selectUser({ phoneNumber: selectedInputPhone });
            return user?.id;
        } catch (err) {
            throwError(err);
        }
    },
    setPass: async (id: string, selectedPassword: string): Promise<number> => {
        try {
            return await modelUser.updateUser({ password: selectedPassword }, id)
        } catch (err) {
            throwError(err);
        }
    },
    createUser: async (selectedPhone: string, selectedPassword: string): Promise<User | null> => {
        try {
            const existingUser = await modelUser.selectUser({ phoneNumber: selectedPhone });
            if (existingUser) {
                return null;
            }
            const avatar: string = '/pictures/avatar.jpg';
            const thumbnail: string = '/pictures/avatar.jpg'
            return await modelUser.createUser({ phoneNumber: selectedPhone, password: selectedPassword, avatar: avatar, thumbnail: thumbnail });
        } catch (err) {
            throwError(err);
        }
    }

};
export { methods };