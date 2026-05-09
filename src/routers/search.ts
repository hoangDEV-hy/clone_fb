import express, { Request, Response, NextFunction } from "express";
import { SearchController } from "../Constrollers/SearchController";

// ============================================================
// SEARCH ROUTES
// Responsibility: Define endpoints, attach middleware, call controller
// ============================================================

const router = express.Router();

router.get('/chatmember', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const name = req.query.name as string;
        const idUser = req.query.idUser as string;
        const idChatRoom = Number(req.query.chat_roomId);

        const result = await SearchController.searchChatMembersAndFriends(name, idUser, idChatRoom);

        res.json({
            chatMembers: result.chatMembers,
            friendList: result.friendList
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.get('/get', async (req: Request, res: Response): Promise<void> => {
    const selectedName = req.query.name as string;

    const result = await SearchController.searchGroupsAndUsers(selectedName);

    res.send({ list: result });
});

router.get('/', (req: Request, res: Response) => {
    res.render('Contents/Search');
});

export default router;
