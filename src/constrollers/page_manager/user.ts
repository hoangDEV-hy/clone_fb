import { Request, Response } from 'express';
import { User, methods } from '../../models/user'; // đường dẫn model tùy theo dự án của bạn

export let method = {
    takeUser: async (req: any, res: Response): Promise<void> => {
        const id = req.admin.id; // bạn cần đảm bảo `req.admin` đã được middleware gán trước đó
        try {
            const user = await User.findOne({
                where: {
                    id: id
                }
            });

            if (!user) {
                res.status(401).json({ message: 'Invalid user ID' });
            } else res.json({ user });// trả về user với key rõ ràng hơn
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },
    updateUser: async (req: any, res: Response): Promise<any> => {
        try {

            const { name, hastag } = req.body;
            const id = req.admin.id;
            await methods.updateUser({ name: name, hastag: hastag }, id, res);
            return res.json({ message: 'updated' })
        } catch (error) {
            console.error('Update error:', error);
            return res.status(500).json({ error: 'Update failed', detail: error });
        }
    },
    handleUpload: async (req: Request, res: Response): Promise<void> => {
        if (!req.file) {
            res.status(400).send('No file uploaded.');
            return;
        }

        const imagePath = `/pictures/${req.file.filename}`;
        res.json({ message: 'uploaded' });
    },
    updateThumnailUser: async (req: any, res: Response): Promise<any> => {
        try {

            const {  } = req.body;
            const id = req.admin.id;
            await methods.updateUser({ name: name, hastag: hastag }, id, res);
            return res.json({ message: 'updated' })
        } catch (error) {
            console.error('Update error:', error);
            return res.status(500).json({ error: 'Update failed', detail: error });
        }
    },

}



