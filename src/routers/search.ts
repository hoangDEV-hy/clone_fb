import express, { Request, Response, NextFunction, Router } from "express";
import { chat_member } from "../models/chat/chat_members";
import { user_user } from "../models/user_user";
import { Op } from "sequelize";
import { User } from "../models/user";
import { methods as groupController } from "../constrollers/group";
import { methods as userController } from "../constrollers/User"

const router: Router = express.Router();

router.get('/chatmember', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const name = req.query.name as string;
        const idUser = req.query.idUser as string;
        const idChatRoom = Number(req.query.chat_roomId);


        // ============================
        // 1. LẤY DANH SÁCH CHAT MEMBERS
        // ============================
        const chatMembers = await chat_member.findAll({
            where: { chat_id: idChatRoom },
            include: [
                {
                    model: User,
                    as: 'users',
                    required: true,
                    attributes: ['id', 'name', 'avatar'],
                    where: {
                        name: { [Op.like]: `${name}%` }
                    }
                }
            ]
        });

        const existingUserIds = chatMembers.map(m => { return m.idUser });

        // ============================
        // 2. LẤY DANH SÁCH BẠN BÈ
        // ============================
        const friends = await user_user.findAll({
            where: {
                status: 'done',
                [Op.or]: [
                    { id_userA: idUser },
                    { id_userB: idUser }
                ]
            },
            attributes: ['id_userB', 'id_userA'],
            include: [
                {
                    model: User,
                    as: 'userA',
                    attributes: ['id', 'name', 'avatar']
                },
                {
                    model: User,
                    as: 'userB',
                    attributes: ['id', 'name', 'avatar']
                }
            ]
        });

        // ============================
        // 3. LỌC DANH SÁCH BẠN THEO NAME GIỐNG TÌM KIẾM
        // ============================
        const searchedFriends = friends
            .map((f: any) => {
                // nếu userA = mình → bạn là userB
                if (f.id_userA === idUser) return f.userB;
                // nếu userB = mình → bạn là userA
                return f.userA;
            })
            .filter(friend =>
                friend.name.toLowerCase().startsWith(name.toLowerCase())
            );


        // ============================
        // 4. LOẠI BỎ BẠN ĐÃ CÓ TRONG CHAT
        // ============================
        const filteredFriendList = searchedFriends.filter(friend =>
            !existingUserIds.includes(friend.id)
        );

        res.json({
            chatMembers,
            friendList: filteredFriendList
        });

    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.get('/get', async (req: Request, res: Response): Promise<void> => {
    const selectedName = req.query.name as string;

    const selectedGroups = await groupController.selectGroupsWithName(selectedName) || [];
    const selectedUsers = await userController.selectUsersWithName(selectedName) || [];

    const groupsWithType = selectedGroups.map(g => ({
        ...(g.toJSON ? g.toJSON() : g),
        type: 'group'
    }));

    const usersWithType = selectedUsers.map(u => ({
        ...(u.toJSON ? u.toJSON() : u),
        type: 'user'
    }))
    // Gộp 2 mảng
    const merged = [...groupsWithType, ...usersWithType];

    // Lọc trùng theo name
    const uniqueList = Array.from(
        new Map(merged.map(item => [item.name, item])).values()
    );

    // Convert sang JSON thuần (Sequelize safe)
    const result = uniqueList.map(item =>
        item.toJSON ? item.toJSON() : item
    );

    res.send({
        list: result
    });
});

router.get('/', (req: Request, res: Response) => {
    res.render('contens/search')
})



export { router };
