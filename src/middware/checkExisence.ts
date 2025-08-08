import { User } from '../models/user';
import { Request, Response } from 'express';

export const method = ({
    check: async (req: any, res: Response): Promise<void> => {
        try {

            const { id } = req.body;
            const exist = await User.findAll({
                where: { idGroup: id }
            });
            if (!exist) res.json({ message: 'Don\'t join this group' });
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: 'failed to check' });
        }

    },

});

