import express, { Request, Response } from "express";
import FollowerController from '../constrollers/Ctrl_Follower';

let router = express.Router();

router.get('/followers', async (req: Request, res: Response): Promise<void> => {
    try {
        const { selectedFollowerID, page = '1' } = req.query;

        const data = await FollowerController.selectDanhSach(
            selectedFollowerID as string,
            Number(page)
        );

        res.json(data);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/followers', async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            selectedFollowerID,
            additionedFollowingsID,
            notification_value
        } = req.body;

        if (
            !selectedFollowerID ||
            !additionedFollowingsID ||
            notification_value === undefined
        ) {
            res.status(400).json({
                error: true,
                message: 'Thiếu inputs'
            });
        }

        // Không thể follow chính mình
        if (selectedFollowerID === additionedFollowingsID) {
            res.status(400).json({
                error: true,
                message: 'Không thể follow chính mình'
            });
        }

        const data = await FollowerController.addFollowers(
            additionedFollowingsID,
            selectedFollowerID,
            notification_value
        );

        res.json(data);
    } catch (error) {
        console.error('Error in addFollowers route:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/followers', async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            selectedFollowerID,
            deletedFollowingsID,
            notification_value
        } = req.body;

        if (
            !selectedFollowerID ||
            !deletedFollowingsID ||
            notification_value === undefined
        ) {
            res.status(400).json({
                error: true,
                message: 'Thiếu inputs'
            });
        }

        const data = await FollowerController.deleteFollowers(
            deletedFollowingsID,
            selectedFollowerID,
            notification_value
        );

        res.json(data);
    } catch (error) {
        console.error('Error in deleteFollowers route:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export { router };
